---
topic: zabal, governance, zoe, operations
type: ops-spec
status: EXECUTE NOV 17 — ZOE runs this poll during ZABAL S2 Week 12 (Nov 17-21). Poll opens Monday Nov 17, closes Wednesday Nov 19 at 11:59PM ET. Winner announced Thursday Nov 20. Results inform graduation ceremony on Nov 21 (doc 1677). ZOR holders vote.
last-validated: 2026-07-18
related-docs: 1677-zabal-s2-zoe-weekly-ops-guide, 1626-zabal-s2-curriculum-spec, 1678-africa-battle-week-charity-snapshot-spec, 1567-zabal-s2-participant-tracker-spec, 1710-zao-h2-milestone-tracker
action-owner: ZOE (set up poll, post announcements, monitor votes, post results); Zaal (approves nominations slate by Nov 15, approves result post); ZOR holders (vote Nov 17-19)
---

# 1737 — ZABAL S2 People's Choice Poll Spec (Week 12, Nov 17-21)

> **What this is:** The complete spec for ZABAL S2's People's Choice vote — the final community governance moment of Season 2. ZOR holders vote for their favorite ZABAL S2 participant across two categories: Best Builder (Track B) and Best Artist (Track A). This vote shapes the graduation ceremony and is one of ZAO's highest-stakes community governance actions of 2026. Doc 1677 Week 12 references this poll but doesn't specify how it works — this doc fills that gap.
>
> **Why ZOR holders vote (not general community):** ZABAL S2 is about people who built ZAO. ZOR holders are the community members who've engaged deeply with ZAO governance (ZOR = soulbound ERC-1155, 157 holders as of Jul 2026). They are the right audience to evaluate which participants had the most impact on ZAO.
>
> **What the winner receives:**
> - Public shout-out in the graduation ceremony (doc 1677 Nov 21 ops)
> - Featured in ZAO Newsletter Issue 4 (post-graduation)
> - Optional: micro-grant from ZAO treasury (Zaal decides amount — this doc does NOT commit a specific amount)

---

## Pre-Poll Setup (Nov 10-15)

### Nov 10 — Nomination Slate Preparation

ZOE queries Supabase `zabal_s2_participants` to generate the eligible nominee list:

```sql
SELECT 
  farcaster_handle,
  telegram_handle, 
  track,
  (SELECT COUNT(*) FROM zabal_s2_milestones m 
   WHERE m.participant_id = p.id AND m.type = 'battle_completion') as battles_completed,
  (SELECT COUNT(*) FROM zabal_s2_milestones m 
   WHERE m.participant_id = p.id AND m.type IN ('zaoos_doc', 'zaoos_pr_merged')) as docs_merged,
  (SELECT COUNT(*) FROM zabal_s2_attendance a 
   WHERE a.participant_id = p.id AND a.attended = true) as sessions_attended
FROM zabal_s2_participants p
WHERE p.status = 'ACCEPTED'
  AND p.cohort = 'S2'
ORDER BY track, sessions_attended DESC;
```

**Eligibility criteria for People's Choice nomination:**
- Attended at least 7/12 sessions (≥58% attendance)
- Not dropped from the cohort (status = ACCEPTED)
- No category restriction: a Track A artist can be nominated for Best Builder if they made significant contributions; ZOE flags ambiguous cases to Zaal

ZOE sends Zaal the nominee list by Nov 10:
```
ZABAL S2 People's Choice nominations: ready for your review.

TRACK B — BUILDER NOMINEES (attended ≥7 sessions, at least 1 merged PR):
[list of handles + battle/doc counts]

TRACK A — ARTIST NOMINEES (attended ≥7 sessions, at least 1 battle completed):
[list of handles + battle counts]

EDGE CASES (you decide):
[handles that don't clearly fit one category]

Reply by Nov 15 with:
- Approved nominee list for each category
- Any nominees to add or remove
- Whether to include a write-in option
```

### Nov 15 — Zaal Approves Nominee Slate

**GATED:** ZOE does not set up the poll until Zaal approves the nominee list.

Zaal replies with confirmed nominees (edit and send back or reply "approved as-is").

ZOE updates the approved list to `~/.zao/zoe/zabal-s2-nominees.json`:
```json
{
  "track_b_nominees": ["@handle1", "@handle2", "@handle3"],
  "track_a_nominees": ["@handle1", "@handle2", "@handle3"],
  "approved_by_zaal": "2026-11-15",
  "write_in": false
}
```

---

## Poll Setup (Nov 15-16)

### Voting Platform: Snapshot.org

ZOR token strategy (same as Africa Battle Week charity vote, per doc 1678):
- Space: `thezao.eth`
- Strategy: `erc1155` — contract `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` (ZOR token on Optimism), token ID `1`
- One token = one vote
- Single choice voting (pick one per category)

**Two separate polls** (one per category):

**Poll 1 — Best Builder (Track B):**
- Title: `ZABAL S2 Best Builder — People's Choice`
- Description: `Which ZABAL S2 Track B participant had the most impact on the ZAO ecosystem? Vote for the builder whose work made ZAO better. ZOR holders only. Voting window: Nov 17-19.`
- Choices: [Track B nominee handles]
- Start: Nov 17, 12:00 PM ET
- End: Nov 19, 11:59 PM ET

**Poll 2 — Best Artist (Track A):**
- Title: `ZABAL S2 Best Artist — People's Choice`
- Description: `Which ZABAL S2 Track A artist made the most impact in WaveWarZ and on-chain music this season? ZOR holders only. Voting window: Nov 17-19.`
- Choices: [Track A nominee handles]
- Start: Nov 17, 12:00 PM ET
- End: Nov 19, 11:59 PM ET

ZOE creates both polls on Snapshot.org and saves the poll URLs to `~/.zao/zoe/zabal-s2-peoples-choice-urls.json`.

---

## Nov 17 (Monday) — Poll Opens

### 12:00 PM — Poll Announcement Posts

ZOE posts to /zao (announcing both polls):
```
ZABAL Season 2: People's Choice vote is open.

12 weeks. [N] participants.
ZOR holders: choose the best.

BEST BUILDER: [Snapshot URL 1]
BEST ARTIST: [Snapshot URL 2]

Closes Wed Nov 19 at midnight ET.
```

ZOE posts to ZABAL S2 Telegram:
```
People's Choice vote is live.

ZABAL S2 cohort: you can share these with your communities. ZOR holders decide.

Best Builder: [Snapshot URL 1]
Best Artist: [Snapshot URL 2]

Closes Wednesday night.
```

ZOE sends DMs to all ZOR holders (if ZOE has a ZOR holder list from Supabase or doc 1678):
```
ZABAL S2 People's Choice vote is open.

Two polls — one for best builder, one for best artist.

You helped build what ZABAL S2 is. Choose who stood out.

[URLs]

Closes Nov 19 midnight ET.
```

If ZOE doesn't have a ZOR holder contact list: ZOE posts to /zao and ZABAL S2 Telegram only, notes to Zaal that individual holder DMs were skipped.

### ZABAL S2 Week 12 Session (2:00 PM)

Per doc 1677 Week 12 special: "People's Choice poll open Mon-Wed. Zaal's direction this week."

ZOE handles Week 12 session ops per standard Monday protocol. Zaal's Week 12 agenda includes announcing the poll at the start of session and announcing results during graduation (Nov 21).

---

## Nov 18 (Tuesday) — Mid-Vote Update

### 2:00 PM — Vote Count Check

ZOE queries Snapshot API for current vote counts (Snapshot is public; no API key needed for read):
```
GET https://hub.snapshot.org/graphql

query {
  votes(
    where: { proposal: "[proposal_id]" }
  ) { choice, vp }
}
```

ZOE does NOT post real-time standings publicly (prevents bandwagon effect or gaming by late voters). ZOE sends Zaal a private update:
```
People's Choice mid-vote update (Nov 18 2PM):

Best Builder: [N] total votes cast. Leading: [handle] with [X] votes.
Best Artist: [N] total votes cast. Leading: [handle] with [X] votes.

Poll closes tomorrow midnight.
```

If fewer than 10 votes cast by Nov 18 PM: ZOE posts a reminder to /zao and ZABAL S2 Telegram:
```
ZABAL S2 People's Choice: polls close TOMORROW (Nov 19, midnight ET).

Still open: [URLs]

ZOR holders: 2 minutes to vote.
```

---

## Nov 19 (Wednesday) — Final Push + Poll Close

### 9:00 AM — Closing Reminder

ZOE posts to /zao + ZABAL S2 Telegram:
```
ZABAL S2 People's Choice closes TONIGHT.

Vote by midnight ET:
Best Builder: [URL]
Best Artist: [URL]

ZOR holders only. One vote per poll.
```

### 11:59 PM — Poll Closes (Snapshot auto-closes)

ZOE checks that both polls have closed on Snapshot. If a poll auto-extended (Snapshot quirk): ZOE DMs Zaal with the final count and asks whether to treat as closed.

---

## Nov 20 (Thursday) — Winner Reveal Prep

### 9:00 AM — Final Vote Count Pull

ZOE pulls final vote counts from Snapshot for both polls. Logs to `~/.zao/zoe/zabal-s2-peoples-choice-results.json`:
```json
{
  "best_builder": {
    "winner": "@[handle]",
    "winner_votes": [N],
    "total_votes": [N],
    "runner_up": "@[handle]",
    "runner_up_votes": [N]
  },
  "best_artist": {
    "winner": "@[handle]",
    "winner_votes": [N],
    "total_votes": [N],
    "runner_up": "@[handle]",
    "runner_up_votes": [N]
  },
  "snapshot_proposal_ids": ["[id1]", "[id2]"],
  "poll_closed": "2026-11-19T23:59:00-05:00"
}
```

### 10:00 AM — Winner Reveal Post (GATED)

**ZOE drafts and sends to Zaal for approval before posting.**

Draft:
```
ZABAL S2 People's Choice results:

Best Builder: @[handle]
[N] votes out of [total]

Best Artist: @[handle]
[N] votes out of [total]

Official announcement: tomorrow at graduation.

Thank you to every ZOR holder who voted.
```

**Zaal approves via Telegram ("post it") before ZOE sends.** Winner must be revealed for the first time at graduation (Nov 21) — not before. This post goes out after graduation unless Zaal says otherwise.

**IMPORTANT:** If Zaal wants the surprise preserved for graduation, ZOE holds the winner reveal post until AFTER the graduation ceremony on Nov 21. ZOE asks: "Should I post the winner now (Nov 20) or wait until after graduation tomorrow?"

---

## Nov 21 (Friday) — Graduation Night (People's Choice Moment)

Per doc 1677 Week 12 + graduation ops:

ZOE prepares the graduation night People's Choice reveal posts in advance (but does NOT post until Zaal signals "post it" during or after the ceremony):

**During Graduation (Zaal announces winner verbally):**
ZOE holds posts ready.

**Post-Graduation (within 30 min of ceremony end):**

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
People's Choice winners announced.

Best Builder: @[handle]
Best Artist: @[handle]

Congratulations. You had the most impact on ZAO this season.
The knowledge base, the battles, and the community remember.
```

ZOE sends DMs to both winners (Farcaster XMTP or Telegram):
```
Congratulations — you won the ZABAL S2 People's Choice.

Best [Builder/Artist] of Season 2.

[N] ZOR holders voted for you.

Your work during these 12 weeks made a real difference.

— ZAO
```

---

## Edge Cases

### Tie in either category
If two nominees are exactly tied by vote count: ZOE alerts Zaal. Options: declare both winners (co-winners), run a tiebreaker Snapshot poll (3-hour window), or Zaal breaks the tie manually. ZOE does NOT auto-declare a winner in a tie.

### Fewer than 5 total votes in either poll
ZOE alerts Zaal: "[Category] poll had only [N] votes — may not be representative. Would you like to extend the window 24h or proceed?" ZOE does not post results publicly until Zaal decides.

### A nominee asks ZOE to campaign for them
ZOE does NOT advocate for any nominee. ZOE's only public action is the neutral announcement and closing reminder. If a nominee asks ZOE to post on their behalf, ZOE replies: "I can't advocate for specific nominees. I posted the poll — ZOR holders decide."

### ZOR holder list is incomplete (fewer than expected voters)
Expected voter pool is ~157 ZOR holders as of Jul 2026. If final votes are fewer than 20: ZOE flags to Zaal but does NOT invalidate the vote. Low voter participation does not make the result invalid — it just means the engaged holders chose.

### A nominee drops out of ZABAL S2 before Nov 17
ZOE removes them from the Snapshot poll before it goes live (amend the poll on Snapshot). If they drop out after the poll opens: ZOE DMs Zaal. If the dropped participant is currently leading: Zaal decides whether to void their votes.

---

## People's Choice in the H2 Milestone Tracker

Per doc 1710 (ZAO H2 milestone tracker), ZOE adds People's Choice results to the November snapshot:
- Best Builder winner + vote count
- Best Artist winner + vote count
- Total ZOR holder participation rate (votes cast / 157 holders)

Citable fact template for grants/press:
```
"ZABAL S2's Season 2 People's Choice vote drew [N] ZOR holders, who chose @[builder] as Best Builder and @[artist] as Best Artist from a cohort of [N] participants."
```

---

## Sources

- `research/zabal/1677-zabal-s2-zoe-weekly-ops-guide/` — Week 12 special instructions (People's Choice mentioned as Zaal's direction week)
- `research/zabal/1626-zabal-s2-curriculum-spec/` — ZABAL S2 Track A/B graduation criteria (source of what "best" means)
- `research/events/1678-africa-battle-week-charity-snapshot-spec/` — Snapshot.org setup template (same ZOR strategy used here)
- `research/zabal/1567-zabal-s2-participant-tracker-spec/` — Supabase schema for eligibility queries
- `research/technology/1710-zao-h2-milestone-tracker/` — November snapshot destination
