---
topic: zabal, zoe, operations, events
type: graduation-ops-guide
status: EXECUTE NOV 21 — ZOE runs this guide on the final day of ZABAL Season 2 (Week 12, Nov 21, 2026). The graduation session runs at 2PM ET (regular Monday time). This doc covers the pre-ceremony prep, ZOE's ceremonial posts, micro-grant announcements, People's Choice winner reveal, and post-ceremony recap. Feeds from doc 1737 (People's Choice Poll Spec) and doc 1677 (ZABAL S2 weekly ops Week 12).
last-validated: 2026-07-18
related-docs: 1737-zabal-s2-peoples-choice-poll-spec, 1677-zabal-s2-zoe-weekly-ops-guide, 1626-zabal-s2-curriculum-spec, 1567-zabal-s2-participant-tracker-spec, 1696-zabal-s2-onchain-release-protocol, 1702-zabal-s2-track-b-zaoos-doc-guide
action-owner: ZOE (all posts and Supabase writes below); Zaal (runs the ceremony, announces People's Choice winners live, approves graduation post and micro-grant amounts); Hurricane (confirms ZABAL S2 Track A on-chain release verification if any are pending)
---

# 1742 — ZABAL S2 Graduation Night Ops (Nov 21, 2026)

> **What this is:** ZOE's complete ops guide for the final day of ZABAL Season 2. Nov 21 is the 12th and final Monday session. It's a graduation ceremony: eligible participants are acknowledged, People's Choice winners are announced, micro-grants are declared, and the season formally closes. ZOE's role is to handle all external communications (Farcaster, Telegram) before, during, and after the ceremony. Zaal runs the session itself.
>
> **Who graduates:** ZABAL S2 participants who meet the minimum graduation criteria by Nov 21:
> - Track A (Artist): 5+ completed WaveWarZ battles + 1 on-chain release (Sound.xyz or Zora)
> - Track B (Builder): 2+ merged ZAOOS PRs
> - Both tracks: attended at least 7 of 12 sessions
>
> **What happens at graduation:**
> 1. Zaal reviews the season — milestones hit, battles run, docs written
> 2. Eligible graduates acknowledged by name (ZOE posts to /zabal simultaneously)
> 3. People's Choice winners announced (doc 1737)
> 4. Micro-grant amounts declared by Zaal (GATED — Zaal decides amounts)
> 5. Season close statement
>
> **All times ET.**

---

## Pre-Ceremony Prep (Nov 17-20)

These tasks run before graduation night:

**Nov 17 (Monday):**
ZOE opens the People's Choice poll per doc 1737. Graduation is 4 days away.

**Nov 19 (Wednesday):**
ZOE posts a final Week 12 reminder to ZABAL S2 Telegram:
```
Graduation is Friday (Nov 21) at 2PM ET.

Same join link as every Monday.

If you're eligible to graduate: we'll say your name at 2PM Friday.
```

**Nov 20 (Thursday):**

ZOE queries Supabase to generate the final graduation report for Zaal:

```sql
SELECT 
  p.farcaster_handle,
  p.telegram_handle,
  p.track,
  (SELECT COUNT(*) FROM zabal_s2_milestones m 
   WHERE m.participant_id = p.id AND m.type = 'battle_completion') as battles_completed,
  (SELECT COUNT(*) FROM zabal_s2_milestones m 
   WHERE m.participant_id = p.id AND m.type = 'on_chain_release') as releases,
  (SELECT COUNT(*) FROM zabal_s2_milestones m 
   WHERE m.participant_id = p.id AND m.type IN ('zaoos_doc', 'zaoos_pr_merged')) as docs_merged,
  (SELECT COUNT(*) FROM zabal_s2_attendance a 
   WHERE a.participant_id = p.id AND a.attended = true) as sessions_attended,
  CASE 
    WHEN p.track = 'A' AND
         (SELECT COUNT(*) FROM zabal_s2_milestones m WHERE m.participant_id = p.id AND m.type = 'battle_completion') >= 5 AND
         (SELECT COUNT(*) FROM zabal_s2_milestones m WHERE m.participant_id = p.id AND m.type = 'on_chain_release') >= 1 AND
         (SELECT COUNT(*) FROM zabal_s2_attendance a WHERE a.participant_id = p.id AND a.attended = true) >= 7
    THEN 'ELIGIBLE'
    WHEN p.track = 'B' AND
         (SELECT COUNT(*) FROM zabal_s2_milestones m WHERE m.participant_id = p.id AND m.type IN ('zaoos_doc', 'zaoos_pr_merged')) >= 2 AND
         (SELECT COUNT(*) FROM zabal_s2_attendance a WHERE a.participant_id = p.id AND a.attended = true) >= 7
    THEN 'ELIGIBLE'
    ELSE 'INELIGIBLE'
  END as graduation_status
FROM zabal_s2_participants p
WHERE p.status = 'ACCEPTED' AND p.cohort = 'S2'
ORDER BY graduation_status DESC, p.track, p.farcaster_handle;
```

ZOE sends Zaal the graduation report via Telegram (Nov 20):
```
ZABAL S2 Graduation Report — Nov 20

ELIGIBLE GRADUATES:
Track A (Artists — 5 battles + 1 release + 7 sessions):
[List of handles + battle count + release URL]

Track B (Builders — 2 PRs + 7 sessions):
[List of handles + PR URLs + session count]

INELIGIBLE (did not meet criteria):
[Handle] — Track [A/B] — Missing: [battles: N/5 / release: 0/1 / sessions: N/12 / PRs: N/2]

BORDERLINE (1 criterion short):
[Handle] — Track [A/B] — Missing: [specific gap] — your call on discretionary graduation.

People's Choice winners (from doc 1737 poll):
Best Builder: @[handle] ([N] votes)
Best Artist: @[handle] ([N] votes)

Micro-grant: how much are you awarding each graduate? (Reply with dollar amount or "TBD at ceremony")
```

**GATED:** Zaal must reply to this report before Nov 21 2PM with: (1) confirmed graduate list (may include discretionary adds), (2) People's Choice winner approval to announce, (3) micro-grant amount(s) or "announce at ceremony."

---

## Nov 21 — Graduation Day Timeline

### 9:00 AM — Graduation Day Announcement

ZOE posts to /zabal + /zao:
```
ZABAL Season 2 graduation is today.

12 weeks. [N] participants.

The final session: 2PM ET.

Every participant who battled, built, and shipped: this session is for you.

[Join link]
```

ZOE posts to ZABAL S2 Telegram:
```
Graduation day.

2PM ET. Same link as always.

[Join link]

See you there.
```

### 11:00 AM — Pre-Ceremony ZOL Post

ZOL posts to /wavewarz (Track A context):
```
ZABAL S2 graduation is today.

Track A artists completed [total battles across all S2 artists] WaveWarZ battles this season.

Some of those artists are graduating at 2PM.
```

### 1:45 PM — Go-Live Reminder

ZOE posts to ZABAL S2 Telegram:
```
ZABAL S2 final session starting in 15 minutes.

[Join link]
```

ZOE posts to /zabal:
```
ZABAL S2 Week 12: graduating now.

Starting in 15 minutes.
[Join link]
```

### 2:00 PM — Ceremony Begins (ZOE Monitor Only)

ZOE monitors ZABAL S2 Telegram for tech issues. ZOE does NOT post during the active ceremony — Zaal is presenting. ZOE holds all prepared posts until Zaal gives the signal.

**ZOE's prepared graduation posts (queued, not sent yet):**
1. Graduate acknowledgement post (one per graduate, or one combined post)
2. People's Choice winner posts (from doc 1737)
3. Micro-grant announcement post
4. Season close post

ZOE sends these in sequence as Zaal signals via Telegram: "post graduates," "post people's choice," "post micro-grants," "post close."

---

## Ceremony Posts (Sent on Zaal's Signal)

### On "post graduates" Signal

ZOE posts to /zabal:
```
ZABAL Season 2 graduates:

Track A — Artists:
@[handle] — [N] battles, [on-chain release URL]
@[handle] — [N] battles, [on-chain release URL]
[...]

Track B — Builders:
@[handle] — [N] PRs merged
[PR title 1], [PR title 2]
@[handle] — [N] PRs merged
[...]

[Total N] graduates.
12 weeks.
```

ZOE posts to ZABAL S2 Telegram:
```
ZABAL S2 graduates:

[List of handles — just handles, no stats, Telegram-friendly format]

Congratulations to all.
```

ZOE also posts to /zao (ZAO community announcement):
```
ZABAL Season 2: [N] graduates.

[N] artists. [N] builders.

Track A artists completed [total] WaveWarZ battles this season.
Track B builders merged [total] ZAOOS docs.

The knowledge base they wrote is live. The battles they fought are on-chain.
```

### On "post people's choice" Signal

Per doc 1737 graduation-night People's Choice reveal posts (if Zaal decided to hold the reveal until graduation):

ZOE posts to /zabal:
```
ZABAL S2 People's Choice winners:

Best Builder: @[handle]
[N] ZOR votes.

Best Artist: @[handle]
[N] ZOR votes.

The community chose.
```

ZOE posts to ZABAL S2 Telegram:
```
People's Choice:

Best Builder: @[handle]
Best Artist: @[handle]

Congratulations.
```

ZOE sends winner DMs (per doc 1737):
```
Congratulations — you won the ZABAL S2 People's Choice.

Best [Builder/Artist] of Season 2.

[N] ZOR holders voted for you.

Your work during these 12 weeks made a real difference.

— ZAO
```

### On "post micro-grants" Signal

**GATED:** Zaal must have confirmed the micro-grant amount before this post goes out. ZOE does NOT announce an amount that Zaal hasn't confirmed.

ZOE posts to /zabal:
```
ZABAL S2 micro-grants:

[N] graduates receive [$X / [X] SOL / [X] ZOR] each.

This is ZAO's recognition of what you built this season.
On-chain. Direct to your wallet.

Distribution: [timeline Zaal confirms — "within 7 days" or "by [date]"]
```

ZOE posts to ZABAL S2 Telegram:
```
Micro-grants: [$X / SOL / ZOR] per graduate.
Distribution: [timeline].

Send your wallet address to Zaal by [deadline] if you haven't already.
```

ZOE logs the micro-grant announcement to `~/.zao/zoe/zabal-s2-microgrants.jsonl`:
```json
{
  "season": "S2",
  "amount_per_graduate": "[amount]",
  "currency": "[USD/SOL/ZOR]",
  "total_graduates": [N],
  "announced_at": "[ISO timestamp]",
  "distribution_deadline": "[date]"
}
```

If Zaal says "TBD at ceremony" but then doesn't give ZOE an amount: ZOE does NOT announce an amount. ZOE sends a follow-up after the ceremony: "What's the micro-grant amount? I can post it tonight or whenever you're ready."

### On "post close" Signal

ZOE posts to /zabal:
```
ZABAL Season 2 is complete.

12 weeks. [N] participants. [N] graduates.

[N] WaveWarZ battles.
[N] ZAOOS docs.
[Total SOL] SOL to artists.

What you built is still running.

Season 3: planning starts in 2027.
Follow /zabal to find out when.
```

ZOE posts to /zao:
```
ZABAL S2 is done.

12 weeks of builders and musicians.
[N] graduates.

The ZAO ecosystem is better because of them.

Season 3: 2027.
```

ZOE posts to ZABAL S2 Telegram:
```
Season 2 is complete.

Thank you for showing up.

[ZABAL S2 Telegram group will stay open for 30 days then archive]
```

---

## Post-Ceremony Tasks (Nov 21 Evening)

### Attendance Recording (as always)

Zaal sends attendance list for the graduation session → ZOE writes to Supabase `zabal_s2_attendance` for session 12.

### Graduation Status Update (Supabase)

ZOE updates each participant's graduation status in `zabal_s2_participants`:

```sql
UPDATE zabal_s2_participants
SET graduation_status = 'GRADUATED',
    graduation_date = '2026-11-21'
WHERE id IN ([list of eligible graduate IDs]);

UPDATE zabal_s2_participants
SET graduation_status = 'INCOMPLETE'
WHERE id IN ([list of ineligible participant IDs])
  AND cohort = 'S2';
```

### End-of-Season Summary to Zaal

ZOE sends Zaal a Telegram summary after the ceremony:
```
ZABAL S2 graduation complete.

Graduates: [N] / [total enrolled]
Track A: [N] artists graduated
Track B: [N] builders graduated

People's Choice:
Best Builder: @[handle] ([N] votes)
Best Artist: @[handle] ([N] votes)

Micro-grants: [$X per graduate] — [N] wallets needed from: [handles who haven't sent wallet]

Total season stats:
WaveWarZ battles (Track A across all participants): [N]
ZAOOS docs merged (Track B across all participants): [N]
Sessions held: 12
Average attendance: [N]%

Supabase records updated.

Newsletter Issue 4 outline: ready when you want it.
```

---

## Failure Protocols

### Zaal doesn't send graduate list confirmation by Nov 21 11AM
ZOE holds all ceremony posts. At 1PM: ZOE DMs Zaal: "Need confirmed graduate list to prep posts. Reply with 'list confirmed' or with changes. Ceremony is in 1 hour." If no response: ZOE uses the Supabase-generated eligible list as-is for the graduate acknowledgement posts.

### Fewer than 3 participants graduate
ZOE does NOT downplay the count publicly. Posts the actual number. If it's 0 or 1: ZOE asks Zaal: "Should I still post the graduation acknowledgement or would you prefer to do this privately?" Zaal decides.

### People's Choice winner is unreachable for DM
ZOE attempts Farcaster XMTP and Telegram. If neither works: ZOE posts the public winner announcement but holds the personal DM and notes in the end-of-season summary: "[Handle] winner DM failed — Zaal may want to reach out directly."

### Micro-grant distribution delayed (on-chain issues)
ZOE does NOT post about the delay publicly. If Zaal flags a delay, ZOE updates ZABAL S2 Telegram only: "Micro-grant distribution has a brief delay — you'll receive it by [new date]. No action needed from you." ZOE does not detail the on-chain issue publicly.

### Session has technical issues (join link broken, platform down)
Per standard ZABAL S2 Monday failure protocol (doc 1677): ZOE posts to Telegram at 2:10PM: "Session starting — if you're having trouble joining, reply here." ZOE holds all ceremony posts until session is confirmed underway (Zaal Telegrams ZOE: "we're live").

---

## What ZOE Does NOT Do on Graduation Night

- ZOE does NOT announce micro-grant amounts without Zaal's explicit confirmation.
- ZOE does NOT post People's Choice results before Zaal announces them at the ceremony (if Zaal chose to save the reveal).
- ZOE does NOT declare anyone ineligible publicly — if a participant isn't on the graduate list, no public post mentions their name as not graduating.
- ZOE does NOT announce Season 3 dates — Zaal has not confirmed these.

---

## Sources

- `research/zabal/1677-zabal-s2-zoe-weekly-ops-guide/` — Week 12 special instructions + graduation context
- `research/zabal/1737-zabal-s2-peoples-choice-poll-spec/` — People's Choice winner data (feeds this doc's Nov 21 reveal)
- `research/zabal/1626-zabal-s2-curriculum-spec/` — Track A/B graduation criteria
- `research/zabal/1696-zabal-s2-onchain-release-protocol/` — Track A on-chain release milestone (input to graduation eligibility)
- `research/zabal/1702-zabal-s2-track-b-zaoos-doc-guide/` — Track B PR milestone (input to graduation eligibility)
- `research/zabal/1567-zabal-s2-participant-tracker-spec/` — Supabase schema for graduation status update
