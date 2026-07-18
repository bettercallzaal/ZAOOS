---
topic: zabal, zoe, operations
type: onboarding-sequence
status: EXECUTE AUG 15 — ZOE begins this sequence as soon as Zaal confirms the accepted cohort. Runs Aug 15 through Aug 31. Covers: acceptance/rejection DMs, Telegram onboarding, track-specific pre-work, 2-week and 3-day reminders. Feeds directly into doc 1704 (Sep 1 launch day ops).
last-validated: 2026-07-18
related-docs: 1611-zabal-s2-intake-and-selection-spec, 1704-sep1-zabal-s2-launch-day-ops, 1677-zabal-s2-zoe-weekly-ops-guide, 1567-zabal-s2-participant-tracker-spec, 1702-zabal-s2-track-b-zaoos-doc-guide, 1696-zabal-s2-onchain-release-protocol
action-owner: ZOE (all DMs, Supabase writes, reminders); Zaal (makes final cohort selection, confirms session join link by Aug 25, sends ZAOOS GitHub invite for Track B)
---

# 1708 — ZABAL S2 Pre-Season Onboarding Sequence (Aug 15 – Aug 31)

> **What this is:** ZOE's step-by-step guide for the two-week pre-season window between cohort confirmation (Aug 15) and Week 1 (Sep 1). Doc 1611 covers intake and selection (through Aug 15). Doc 1704 covers Sep 1 launch day. This doc covers everything in between: acceptance/rejection notifications, Telegram group setup, track-specific pre-work, and escalating reminders through Aug 31.
>
> **Who ZOE is talking to:** Accepted ZABAL S2 participants (cohort confirmed by Zaal Aug 8-15), rejected applicants (with waitlist note), and waitlisted applicants.

---

## Aug 15: Acceptance/Rejection Notifications

Zaal sends ZOE the final cohort list via Telegram (as a comma-separated list of handles and/or emails, with their tracks). ZOE sends individual messages to all applicants.

### Acceptance DM — Track A (Artist)

Send via Telegram (if they provided Telegram handle) or Farcaster XMTP (if they provided Farcaster handle). Fall back to email for applicants with neither.

```
Hey [Name] —

You're in ZABAL Season 2.

Cohort: [N] builders + musicians.
12 weeks, Sep 1 – Nov 21.
Every Monday 2PM ET.

Your track: Track A — Artist.

What to do before Sep 1:

1. Set up a WaveWarZ account at wavewarz.info (connect your Phantom wallet — instructions at [doc 1696 URL or link])
2. Watch 2 WaveWarZ battles this week — get familiar with how the battles work
3. Join the ZABAL S2 Telegram group: [invite link]
4. Follow /zabal on Farcaster for session updates

Session join link coming by Aug 28.

First session: Sep 1 (or Sep 4 — confirm when you get the week 1 post), 2:00 PM ET.
This is orientation week — no battle requirement yet.

Questions? Reply here or in the Telegram group.

See you Sep 1.
```

### Acceptance DM — Track B (Builder)

```
Hey [Name] —

You're in ZABAL Season 2.

Cohort: [N] builders + musicians.
12 weeks, Sep 1 – Nov 21.
Every Monday 2PM ET.

Your track: Track B — Builder.

What to do before Sep 1:

1. Request access to the ZAOOS GitHub repo: github.com/bettercallzaal/ZAOOS — DM @bettercallzaal on Farcaster with "ZABAL S2 Track B, requesting ZAOOS access"
2. Read the contributor guide: [link to doc 1702] — it explains exactly how to write and submit a ZAOOS doc
3. Read your track requirements: [link to doc 1626] — Track B needs 2+ merged ZAOOS PRs by Week 10 (Nov 2)
4. Join the ZABAL S2 Telegram group: [invite link]
5. Follow /zabal on Farcaster for session updates

Session join link coming by Aug 28.

First session: Sep 1 (or Sep 4 — confirm when you get the week 1 post), 2:00 PM ET.
This is orientation week — ZAO overview, WaveWarZ economics, what 12 weeks looks like.

Questions? Reply here or in the Telegram group.

See you Sep 1.
```

### Acceptance DM — Track Undecided (Both)

```
Hey [Name] —

You're in ZABAL Season 2.

You said you might fit both tracks. No problem — orientation week (Sep 1) will make the decision clear. By the end of Week 1, you'll know which path fits.

For now: join the Telegram group ([invite link]) and follow /zabal on Farcaster.

Questions? Reply here.

See you Sep 1.
```

### Rejection DM (Waitlist)

```
Hey [Name] —

Thank you for applying to ZABAL Season 2.

We had more strong applicants than we had spots in this cohort. You're on the waitlist.

If a spot opens before Sep 1, you'll hear from us first.

For Season 3 (planning for early 2027): your application carries over. No need to reapply.

In the meantime: follow /zabal on Farcaster. You can attend Fractal Democracy sessions (open to all), watch WaveWarZ battles, and contribute to ZAOOS (the knowledge base — docs are welcome from anyone, not just ZABAL participants).

Thank you for applying.
```

### ZOE Supabase writes after notifications

For each accepted participant, ZOE creates or upserts their row in `zabal_s2_participants`:
```sql
INSERT INTO zabal_s2_participants (
  farcaster_handle, telegram_handle, email, track, cohort, status, 
  acceptance_dm_sent, acceptance_dm_sent_at
)
VALUES (
  [handle], [telegram], [email], [track], 'S2', 'ACCEPTED',
  true, NOW()
)
ON CONFLICT (email) DO UPDATE SET
  track = EXCLUDED.track,
  status = 'ACCEPTED',
  acceptance_dm_sent = true,
  acceptance_dm_sent_at = NOW()
```

For waitlisted applicants:
```sql
INSERT INTO zabal_s2_participants (..., status, ...)
VALUES (..., 'WAITLISTED', ...)
```

ZOE logs send results to `~/.zao/zoe/zabal-onboarding.jsonl`:
```json
{"date": "2026-08-15", "accepted": N, "rejected": M, "dms_sent": N+M, "failed": []}
```

---

## Aug 15–22: ZABAL S2 Telegram Group Setup

ZOE manages the ZABAL S2 Telegram group (separate from the main ZAO Telegram group).

**Aug 15 tasks:**
1. Create ZABAL S2 Telegram group if not already done: "ZABAL Season 2 — Sep-Nov 2026"
2. Add all accepted participants (by Telegram handle from their application)
3. Set group description: "ZABAL S2 cohort. Sep 1 – Nov 21. Mondays 2PM ET. @zaoclaw_bot is active here — type @zaoclaw_bot help for commands."
4. Pin welcome message:

```
Welcome to ZABAL Season 2.

[N] participants. 12 weeks. Sep 1 – Nov 21.

What to do before Sep 1:
- Track A (Artists): Set up WaveWarZ at wavewarz.info. Watch 2 battles this week.
- Track B (Builders): Request ZAOOS GitHub access from @bettercallzaal.

First session: Sep 1 (or Sep 4 — TBD), 2PM ET. Join link coming Aug 28.

Use this group for questions, updates, and ZOE commands.
@zaoclaw_bot is live here.
```

**If a participant isn't on Telegram:**
ZOE notes in their Supabase row: `telegram_added = false`. ZOE adds them via Farcaster DM instead (alternative comms channel). Zaal can also manually add them.

---

## Aug 22: Two-Weeks-Out Reminder

ZOE sends to ZABAL S2 Telegram group:

```
ZABAL S2 starts in 10 days (Sep 1).

Pre-season checklist:

Track A (Artists):
  ✓ WaveWarZ account set up? (wavewarz.info)
  ✓ Watched at least 1 battle?
  ✓ Phantom wallet ready?

Track B (Builders):
  ✓ ZAOOS GitHub access approved?
  ✓ Repo cloned? (github.com/bettercallzaal/ZAOOS)
  ✓ Read the contributor guide?

Session join link: coming by Aug 28.

Reply here if you're stuck on anything.
@zaoclaw_bot status — for any questions about your participant status.
```

ZOE also DMs any participant where the completion flag is not set in Supabase. For Track B: ZOE checks if they've been approved for ZAOOS GitHub access (ZOE queries GitHub API or Zaal confirms). If not confirmed: ZOE alerts Zaal "Track B participant [handle] hasn't been added to ZAOOS GitHub yet."

---

## Aug 25: Session Join Link Confirmation

ZOE prompts Zaal via Telegram:
```
ZABAL S2 is 1 week away.

I need:
1. Session join link (Zoom/Juke/TG voice) for Week 1
2. Confirm first session date: Sep 1 or Sep 4?
3. Confirm cohort count: [N] accepted = what I have in Supabase

Reply with: join-link: [URL] | first-date: Sep 1 or Sep 4 | confirm-count: [N]
```

Zaal replies with the confirmed join link. ZOE:
1. Updates ZABAL S2 Telegram pinned message with the join link
2. Prepares the Aug 28 reminder with the confirmed join link

---

## Aug 28: Three-Days-Out Reminder

ZOE sends to ZABAL S2 Telegram group:

```
ZABAL S2 Week 1 is in 3 days.

[Sep 1 or Sep 4] at 2:00 PM ET.

Join: [confirmed join link]

Week 1 agenda: ZAO overview, WaveWarZ economics, what the 12 weeks look like.
No battle or doc requirement this week — just show up and get oriented.

Track A: come with your WaveWarZ account set up.
Track B: come with your ZAOOS GitHub access confirmed.

See you [Sep 1 or Sep 4].
```

ZOE also sends a /zabal Farcaster cast (doc 1675 pre-launch teaser):
```
ZABAL S2 starts in 3 days.

[N] builders and musicians confirmed.
12 weeks. WaveWarZ. ZAOOS. ZAOstock.

Orientation: [Sep 1 or Sep 4] 2PM ET.

The cohort that builds what ZAO needs.
```

---

## Aug 31: Pre-Launch Newsletter Draft

Per doc 1693 (Newsletter Issue 2), ZOE completes the newsletter draft with all brackets filled and sends to Zaal for review. This is covered in doc 1693 — the onboarding sequence ends here.

---

## Track-Specific Pre-Work (Self-Paced Aug 15–Sep 1)

### Track A Required Pre-Work

| Task | What it means | Due |
|------|--------------|-----|
| WaveWarZ account at wavewarz.info | Connect Phantom wallet, complete profile, upload 1 track | Sep 1 |
| Watch 2 WaveWarZ battles | From the battle list on wavewarz.info — any 2 completed battles | Sep 1 |
| Phantom wallet with small SOL | ~$1-2 ETH on Base for gas (if planning on-chain release later) | Sep 1 optional |
| Follow /zabal + /wavewarz on Farcaster | For real-time session updates | Sep 1 |

### Track B Required Pre-Work

| Task | What it means | Due |
|------|--------------|-----|
| ZAOOS GitHub access | DM @bettercallzaal on Farcaster for org access | Aug 22 |
| Clone ZAOOS repo | `git clone https://github.com/bettercallzaal/ZAOOS` | Aug 22 |
| Read doc 1702 | The Track B contributor guide — how to write a ZAOOS doc | Before Sep 1 |
| Read Track B requirements | Doc 1626 — 2+ PRs, ZOE/Hurricane architecture, 3 ZAOOS docs, portfolio | Before Sep 1 |
| Choose first doc topic | Look for a gap (see doc 1702 Step 1) — have a topic idea ready for Week 1 | Sep 1 optional |

ZOE cannot verify most pre-work completion directly. ZOE relies on participants confirming in Telegram and Zaal's check-in during Week 1 orientation.

---

## Failure Protocols

**Participant doesn't respond to acceptance DM:**
ZOE sends a follow-up at Aug 22 (same message + "Tap here or reply 'yes' to confirm your spot"). If no response by Aug 28: ZOE alerts Zaal with the participant's name and contact info. Zaal decides whether to offer the spot to a waitlisted applicant.

**Spot opened from no-response:**
If Zaal confirms offering a spot to a waitlisted applicant: ZOE sends them the Track-appropriate acceptance DM immediately, notes their late onboarding start, and adds them to the Telegram group.

**Track B participant can't get ZAOOS access:**
ZOE DMs Zaal immediately. Zaal invites them directly via GitHub. If still blocked Aug 29+: Zaal approves them as observers (can write docs in a local fork, open PRs without org membership) — GitHub allows public contributors without org membership.

---

## Summary: ZOE Timeline Aug 15–31

| Date | ZOE Task |
|------|---------|
| Aug 15 | Send acceptance DMs (Track A/B/Both) + rejection/waitlist DMs. Create ZABAL S2 Telegram group. Add accepted participants. Pin welcome message. Write all rows to `zabal_s2_participants`. |
| Aug 15-22 | Monitor for Track B GitHub access confirmations. DM stragglers. |
| Aug 22 | Send 2-weeks-out Telegram reminder. DM participants without completion flags. Alert Zaal re: Track B GitHub gaps. |
| Aug 25 | Prompt Zaal for session join link + first session date confirmation. |
| Aug 28 | Send 3-days-out reminder to Telegram + /zabal Farcaster cast. Update pinned message with join link. |
| Aug 31 | Complete Newsletter Issue 2 draft (per doc 1693). |
| Sep 1 | Hand off to doc 1704 (launch day ops). |

---

## Sources

- `research/zabal/1611-zabal-s2-intake-and-selection-spec/` — application form, selection criteria, Aug 15 cohort confirmation
- `research/zabal/1704-sep1-zabal-s2-launch-day-ops/` — Sep 1 activation (this doc ends at Aug 31)
- `research/zabal/1677-zabal-s2-zoe-weekly-ops-guide/` — Week 1 Monday ops (picks up Sep 1)
- `research/zabal/1567-zabal-s2-participant-tracker-spec/` — `zabal_s2_participants` Supabase schema
- `research/zabal/1702-zabal-s2-track-b-zaoos-doc-guide/` — Track B pre-work reading
- `research/zabal/1696-zabal-s2-onchain-release-protocol/` — Track A WaveWarZ + wallet setup guide
- `research/community/1693-zao-newsletter-issue-2-aug2026/` — Newsletter Issue 2 draft timeline (Aug 31 hand-off)
