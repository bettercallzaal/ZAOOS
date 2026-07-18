---
topic: zabal, zoe, operations
type: ops-spec
status: EXECUTE OCT 13 — ZOE runs this eligibility check during ZABAL S2 Week 7 (Oct 13). This is the season's first formal check-in: who is on track to graduate, who is at risk, and who needs immediate intervention. Output: Supabase eligibility report to Zaal, at-risk DMs to participants, and a /zabal Farcaster post with season stats.
last-validated: 2026-07-18
related-docs: 1677-zabal-s2-zoe-weekly-ops-guide, 1742-zabal-s2-graduation-night-ops, 1626-zabal-s2-curriculum-spec, 1567-zabal-s2-participant-tracker-spec, 1702-zabal-s2-track-b-zaoos-doc-guide, 1696-zabal-s2-onchain-release-protocol
action-owner: ZOE (Supabase query, at-risk DMs, Farcaster post); Zaal (reviews report, decides discretionary interventions); participants (reply to at-risk DMs)
---

# 1747 — ZABAL S2 Mid-Season Eligibility Check (Week 7, Oct 13)

> **What this is:** ZABAL S2 runs 12 weeks (Sep 1 – Nov 21). Week 7 (Oct 13) is the midpoint: participants have had half the season to accumulate milestones. This doc specifies the Supabase query ZOE runs, the thresholds for "on track" vs "at risk" vs "intervention needed," the DM templates for at-risk participants, and the end-of-check report to Zaal.
>
> **Why Week 7:** Track A needs 5 battles by Week 12 — at Week 7, a participant who hasn't started is statistically very unlikely to complete 5 battles in 5 remaining weeks if they also have the on-chain release deadline at Week 10. Track B needs 2 PRs by Week 10 (Nov 2) — at Week 7, a participant who hasn't opened their first PR has 3 weeks left to PR + get reviewed + merge + PR again. Week 7 is the last intervention point where a course correction is realistic.
>
> **This runs on the same Monday as Week 7 session.** ZOE does the eligibility check in the morning, sends at-risk DMs before the session, and ZOE alerts Zaal before 1:45PM so Zaal can address at-risk participants in the session.

---

## Step 1: Run the Eligibility Query (Oct 13, 9 AM)

```sql
SELECT 
  p.id,
  p.farcaster_handle,
  p.telegram_handle,
  p.track,
  -- Attendance
  (SELECT COUNT(*) FROM zabal_s2_attendance a 
   WHERE a.participant_id = p.id AND a.attended = true) as sessions_attended,
  -- Track A milestones
  (SELECT COUNT(*) FROM zabal_s2_milestones m 
   WHERE m.participant_id = p.id AND m.type = 'battle_completion') as battles_completed,
  (SELECT COUNT(*) FROM zabal_s2_milestones m 
   WHERE m.participant_id = p.id AND m.type = 'on_chain_release') as releases_completed,
  -- Track B milestones
  (SELECT COUNT(*) FROM zabal_s2_milestones m 
   WHERE m.participant_id = p.id AND m.type IN ('zaoos_doc', 'zaoos_pr_merged')) as prs_merged,
  -- Week 7 status
  CASE
    WHEN p.track = 'A' THEN
      CASE
        WHEN (SELECT COUNT(*) FROM zabal_s2_milestones m WHERE m.participant_id = p.id AND m.type = 'battle_completion') >= 3
             AND (SELECT COUNT(*) FROM zabal_s2_attendance a WHERE a.participant_id = p.id AND a.attended = true) >= 4
        THEN 'ON_TRACK'
        WHEN (SELECT COUNT(*) FROM zabal_s2_milestones m WHERE m.participant_id = p.id AND m.type = 'battle_completion') >= 1
             OR (SELECT COUNT(*) FROM zabal_s2_attendance a WHERE a.participant_id = p.id AND a.attended = true) >= 3
        THEN 'AT_RISK'
        ELSE 'INTERVENTION_NEEDED'
      END
    WHEN p.track = 'B' THEN
      CASE
        WHEN (SELECT COUNT(*) FROM zabal_s2_milestones m WHERE m.participant_id = p.id AND m.type IN ('zaoos_doc', 'zaoos_pr_merged')) >= 1
             AND (SELECT COUNT(*) FROM zabal_s2_attendance a WHERE a.participant_id = p.id AND a.attended = true) >= 4
        THEN 'ON_TRACK'
        WHEN (SELECT COUNT(*) FROM zabal_s2_attendance a WHERE a.participant_id = p.id AND a.attended = true) >= 2
        THEN 'AT_RISK'
        ELSE 'INTERVENTION_NEEDED'
      END
    ELSE 'UNKNOWN_TRACK'
  END as week7_status
FROM zabal_s2_participants p
WHERE p.status = 'ACCEPTED' AND p.cohort = 'S2'
ORDER BY week7_status, p.track, p.farcaster_handle;
```

---

## Step 2: Interpret the Results

### ON_TRACK thresholds at Week 7:

| Track | Metric | Week 7 On-Track Threshold | Final Goal (Week 12) |
|-------|--------|--------------------------|---------------------|
| A (Artist) | WaveWarZ battles | ≥3 completed | 5 completed |
| A (Artist) | On-chain release | 0 OK at W7 (deadline Week 10) | 1 |
| A (Artist) | Session attendance | ≥4 attended | 7 of 12 |
| B (Builder) | ZAOOS PRs merged | ≥1 merged | 2 |
| B (Builder) | Session attendance | ≥4 attended | 7 of 12 |

### AT_RISK thresholds:
- Track A: 1-2 battles completed, OR fewer than 3 sessions attended
- Track B: 0 PRs merged but at least 2 sessions attended (they're showing up but not shipping)

### INTERVENTION_NEEDED:
- Track A: 0 battles completed AND fewer than 3 sessions attended
- Track B: 0 PRs merged AND fewer than 2 sessions attended
- These participants are effectively inactive. Zaal makes the final call on whether to keep them in the cohort.

---

## Step 3: Report to Zaal (Oct 13, 10 AM)

ZOE sends Zaal a Telegram with the full eligibility breakdown:

```
ZABAL S2 Week 7 Mid-Season Eligibility Check
Oct 13, 2026

ON TRACK ([N] participants):
Track A:
  @[handle] — [N]/5 battles, 0 releases (deadline W10), [N]/7 sessions ✓
  ...
Track B:
  @[handle] — [N]/2 PRs merged, [N]/7 sessions ✓
  ...

AT RISK ([N] participants):
Track A:
  @[handle] — [N]/5 battles (needs [N] more in 5 weeks), [N]/7 sessions
  @[handle] — showing up ([N] sessions) but 0 battles — needs to start NOW
  ...
Track B:
  @[handle] — [N] sessions attended, 0 PRs merged yet — PR open by end of this week
  ...

INTERVENTION NEEDED ([N] participants):
  @[handle] — Track A — [N] sessions, [N] battles — effectively inactive
  @[handle] — Track B — [N] sessions, 0 PRs — has not engaged meaningfully
  Your call: keep in cohort as observers, offer waitlist replacement, or drop?

NOTES:
- @[handle] is Track A with 3 battles but no on-chain release progress — flagging since W10 (Nov 2) is the release deadline.
- @[handle] requested extension for missed sessions (illness) — do you want to flag as excused?

Recommend: 
- At-risk: I send DM today and flag in session
- Intervention: you decide whether to reach out directly or let me send a "check-in" DM
```

---

## Step 4: At-Risk DMs (Oct 13, 11 AM, before session)

ZOE sends individual DMs to AT_RISK participants via Telegram (or Farcaster XMTP as fallback):

### Track A (Artist) at-risk DM:

```
Hey [Name] —

Quick check-in from ZABAL S2.

We're at Week 7 of 12. Here's where you stand:

Battles completed: [N]/5 (need [N] more by Week 12, Nov 21)
On-chain release: [done / not yet — deadline Week 10, Nov 2]
Sessions attended: [N]/7 minimum

You're at risk of not meeting the graduation criteria.

What would help: battle now. WaveWarZ battles at wavewarz.info. Any Quick Battle counts. You don't need to win — loser earns too.

If something's come up that's made it hard to participate, reply here and let me know. Zaal can work with you if you communicate.

Next session: today at 2PM ET. This is a good week to show up.
```

### Track B (Builder) at-risk DM:

```
Hey [Name] —

ZABAL S2 check-in.

We're at Week 7 of 12. Here's your status:

ZAOOS PRs merged: [N]/2 (first PR should be open or merged by now — Week 5 was the target)
Sessions attended: [N]/7 minimum

You need 2 merged PRs by Week 10 (Nov 2) to graduate Track B. That's 3 weeks away.

If you haven't opened your first PR yet: today is the day to start. The contributor guide is at [doc 1702 link]. The gap list in that doc has topics you can write right now.

If you have a PR open but it hasn't been reviewed: reply here with the PR URL and I'll flag it for Zaal to review this week.

Next session: today at 2PM ET. Bring your PR link or a topic idea.
```

### INTERVENTION_NEEDED DM (only if Zaal approves sending):

```
Hey [Name] —

We haven't heard much from you in ZABAL S2.

You've attended [N] sessions and completed [N] milestones.

I want to make sure everything is okay. If life has gotten busy and ZABAL S2 isn't possible right now, that's real — just let me know and we can figure out if you want to stay in as an observer or defer to Season 3.

Reply here with how things are going. Zaal and I will take it from there.
```

ZOE logs all DMs sent to `~/.zao/zoe/zabal-s2-atrisk-dms.jsonl`:
```json
{
  "date": "2026-10-13",
  "participant": "@[handle]",
  "track": "A",
  "week7_status": "AT_RISK",
  "dm_channel": "telegram",
  "dm_sent": true
}
```

---

## Step 5: /zabal Midseason Stats Post (Oct 13, 10 AM, same time as Zaal report)

ZOE posts to /zabal:

```
ZABAL S2: Week 7 of 12.

Season so far:

Track A artists:
[N] WaveWarZ battles completed across the cohort.
[N] participants on track for graduation.

Track B builders:
[N] ZAOOS PRs merged across the cohort.
[N] participants on track for graduation.

Halfway there.
Graduation is Nov 21.
```

This post does NOT mention at-risk participants by name. It's a season progress post, not a shaming post.

---

## Step 6: Session Flag for Zaal (Oct 13, 1 PM, before 2PM session)

ZOE sends Zaal a pre-session flag:

```
Week 7 session is in 1 hour.

At-risk participants attending today (based on past attendance pattern):
@[handle] — Track A, 1 battle — mention "battle window is narrowing"
@[handle] — Track B, 0 PRs — mention "Week 5 deadline passed, need PR open this week"

Intervention participants (I've sent a check-in DM; no session attendance expected):
@[handle] — no response to check-in yet

Suggestion: open the session with the mid-season numbers (from /zabal post) and do a "where is everyone" temperature check. Gives at-risk participants a moment to self-report without being called out.
```

---

## Step 7: Post-Check Milestone Log

After the session, ZOE records a milestone check entry to `zabal_s2_milestones` for audit purposes:

```sql
INSERT INTO zabal_s2_milestones (
  participant_id, type, milestone_date, notes
)
SELECT 
  p.id,
  'mid_season_check',
  '2026-10-13',
  CONCAT('W7 status: ', week7_status_value)
FROM zabal_s2_participants p
WHERE p.status = 'ACCEPTED' AND p.cohort = 'S2';
```

This creates an audit trail — graduation doc 1742 can look back and see which participants were already at-risk at Week 7 vs who dropped off in the second half.

---

## What Changes After Week 7

### Track A (Artists)
- Battles remaining: 5 weeks (Weeks 7-12) — maximum 5 more battles possible in weekly battles
- On-chain release deadline: **Week 10 (Nov 2)** — participants who haven't started must begin immediately
- Sessions remaining: 5 of 12 — need to attend all 5 remaining if currently at 2/7

ZOE tracks Track A participants with 0 on-chain releases specially: starting Week 7, ZOE sends a weekly Telegram reminder to Track A participants without a release:
```
Track A reminder: your on-chain release deadline is Week 10 (Nov 2).

No release logged yet.

Steps: mint a free edition on Sound.xyz or Zora (Base). ~$1-2 gas.
Guide: [doc 1696 link]

Once you've minted: @zaoclaw_bot milestone: [handle] zaoos_release [URL]
```

### Track B (Builders)
- Week 7 target: first PR already open (deadline was Week 5)
- Week 10 deadline: first PR merged
- Week 12 deadline: second PR merged

ZOE tracks Track B participants without a first PR as "PR CRITICAL" after Week 7. ZOE DMs them again at Week 8 (Oct 20) if no PR has been opened.

---

## Week 7 vs Final Check (Week 12)

| | Week 7 Check | Week 12 (Graduation) |
|--|-------------|---------------------|
| Purpose | Intervention window — still time to fix | Final eligibility determination |
| Output | At-risk DMs, Zaal report, /zabal stats post | Graduation list, ceremony posts |
| Track A threshold | ≥3 battles = on track | ≥5 battles + 1 release = graduates |
| Track B threshold | ≥1 PR merged = on track | ≥2 PRs merged = graduates |
| What ZOE does with ineligible | Sends DM, flags to Zaal | Updates Supabase INCOMPLETE, does NOT name publicly |

---

## Failure Protocols

### Supabase query returns errors or unexpected nulls
ZOE falls back to manual check: query each participant's milestones individually. If Supabase is down: ZOE DMs Zaal "Supabase query failed for mid-season check — can you provide the current milestone counts for at-risk participants?" ZOE does NOT post the /zabal stats post with unknown data.

### Participant responds to at-risk DM with extenuating circumstances
ZOE acknowledges: "Thanks for reaching out. I'll pass this to Zaal — he makes all calls on extensions and exceptions." ZOE forwards the message to Zaal via Telegram. ZOE does NOT promise extensions.

### More than 50% of cohort is at-risk
ZOE escalates to Zaal before sending any DMs: "Mid-season check shows [N]/[total] participants at-risk or intervention-needed. That's [%] of the cohort. Should we adjust the thresholds or hold DMs until you've reviewed?" Zaal decides whether to send DMs or address in the session first.

### A participant's milestone count is disputed (they claim they did something ZOE doesn't have logged)
ZOE replies: "The @zaoclaw_bot milestone command logs the milestone. If you submitted it, reply with the message timestamp or the PR URL and I'll verify. If you didn't use the bot command, the milestone isn't in the system yet — use @zaoclaw_bot milestone: [handle] [type] [URL] to add it." ZOE does NOT adjust Supabase manually without Zaal's approval.

---

## Sources

- `research/zabal/1677-zabal-s2-zoe-weekly-ops-guide/` — Week 7 special: "mid-season eligibility query" (this doc is the full spec for that mention)
- `research/zabal/1742-zabal-s2-graduation-night-ops/` — Final eligibility query (this doc uses the same criteria)
- `research/zabal/1626-zabal-s2-curriculum-spec/` — Track A/B graduation requirements (source of 5-battle, 1-release, 2-PR criteria)
- `research/zabal/1567-zabal-s2-participant-tracker-spec/` — Supabase table schema for this query
- `research/zabal/1696-zabal-s2-onchain-release-protocol/` — Track A release milestone (on-chain release deadline Week 10)
- `research/zabal/1702-zabal-s2-track-b-zaoos-doc-guide/` — Track B PR deadline (Week 5 first PR, Week 7 first merge, Week 10 second merge)
