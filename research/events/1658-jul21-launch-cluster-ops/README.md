# 1658 — Jul 21, 2026: ZAO Launch Cluster Ops Playbook

**Type:** OPS-PLAYBOOK  
**Topic:** Events  
**Status:** EXECUTE JUL 21 — Four simultaneous ZAO launches on the same day: (1) ZAOstock Eventbrite tickets live, (2) ZABAL S2 applications open, (3) ZAO Newsletter Issue 1 sent, (4) COC #8 date announced. This doc coordinates the staggered posting sequence so each launch gets its own moment. Zaal executes Eventbrite + COC announcement; ZOE handles newsletter send + social posting cascade. GATED: COC #8 date/artist/venue confirmed by Zaal by 9:50AM Jul 21.

---

## The Four Launches

| # | Launch | Owner | Gate |
|---|---|---|---|
| 1 | ZAOstock Eventbrite tickets live | Zaal (Eventbrite publish) | None — ready to go |
| 2 | ZABAL S2 applications open | ZOE (post link + Telegram) | None — site open Jul 21 |
| 3 | ZAO Newsletter Issue 1 sent | ZOE (Paragraph send, GATED Zaal approve) | Zaal approves by 8:45AM |
| 4 | COC #8 date announced | ZOE (post templates) | Zaal confirms date/artist/venue by 9:50AM |

---

## Exact Posting Sequence (Jul 21)

### 8:00 AM — Zaal pre-checks

- [ ] Eventbrite listing published (tickets live — doc 1636 checklist)
- [ ] Newsletter Issue 1 approved (doc 1497 — Zaal final read, responds "APPROVED" to ZOE in Telegram ZAO Ops)
- [ ] ZABAL S2 application page live (verify URL is accessible)
- [ ] Zaal confirms COC #8 date/artist/venue to ZOE via Telegram ZAO Ops before 9:50AM

### 9:00 AM — Newsletter Issue 1 send (ZOE)

ZOE sends Newsletter Issue 1 via Paragraph to all subscribers.

Subject line: `ZAO Newsletter #1 — ZAOstock Is Happening.`

ZOE posts to Telegram ZAO Public immediately after send:
```
ZAO Newsletter #1 just dropped.
Subject: ZAOstock is happening.

If you're subscribed on Paragraph — check your inbox.
If not — subscribe: [Paragraph URL]

- ZAOstock tickets just went live
- ZABAL S2 applications open today
- COC #8 announced at 10AM
- WaveWarZ summer stats
```

### 9:05 AM — ZAOstock tickets live (ZOE posts)

ZOE posts to X:
```
ZAOstock tickets are live.

Oct 3. Ellsworth, Maine.

WaveWarZ MAIN battle. Live sets. Charity payout.
The first time a music DAO brings its governance to an IRL stage.

GA — $25. ZAO Community — $15.
[Eventbrite URL]
```

ZOE posts to Farcaster /zao:
```
ZAOstock tickets are live.

Oct 3 / Ellsworth, Maine / Heart of Ellsworth

WaveWarZ MAIN battle onstage. 100% charity battle payout on-chain.
GA $25 | ZAO Community $15

[Eventbrite URL]
```

ZOE posts to Telegram ZAO Public:
```
🎫 ZAOstock tickets are live.

Oct 3. Ellsworth, Maine.

GA: $25 | ZAO Community (ZOR holders + ZABAL): $15

Grab yours: [Eventbrite URL]
```

### 9:10 AM — ZABAL S2 applications (ZOE posts)

ZOE posts to X:
```
ZABAL S2 applications are open.

12-week accelerator for artists + builders.
- Artists: 5 WaveWarZ battles + 1 on-chain release by graduation
- Builders: 2 PRs + ZOE/Hurricane fluency + 3 ZAOOS docs

Sep 1 → Nov 21.
Apply by Aug 4: [ZABAL S2 URL]
```

ZOE posts to Farcaster /zao:
```
ZABAL S2 is open for applications.

12 weeks. Sep 1 – Nov 21.
Track A: Artist (battles + on-chain release + governance)
Track B: Builder (PRs + agent fluency + ZAOOS research)

Apply by Aug 4: [ZABAL S2 URL]
```

ZOE posts to Telegram ZAO Public:
```
ZABAL S2 applications are open!

Apply by Aug 4. Program runs Sep 1 – Nov 21.

Application link: [ZABAL S2 URL]

Questions? Drop them in this chat.
```

ZOE sends DMs to ZABAL S1 graduates (pull from `zabal_participants` Supabase — `zabal_cohort = 'S1'`):
```
Hey [name] — ZABAL S2 is open.

You graduated S1. Want to mentor or participate in S2?

Apply: [ZABAL S2 URL]
Deadline: Aug 4.
```

### 9:50 AM — COC #8 announcement gate

**If Zaal has confirmed COC #8 details by 9:50AM:**
Proceed with 10:00AM COC #8 announcement (see below).

**If Zaal has NOT confirmed by 9:50AM:**
ZOE skips COC #8 announcement for today. ZOE sends Telegram ZAO Ops to Zaal:
```
⚠️ GATE: COC #8 announcement is ready to post but waiting for your confirmation (date/artist/venue). Reply with those details and I'll post immediately. Or reply "skip" to delay to Jul 22.
```

### 10:00 AM — COC #8 date announced (ZOE posts, GATED)

ZOE posts to X:
```
COC #8 is on the calendar.

[DATE] — [VENUE or "location TBA"]

ZOR holders: check your DMs for the nomination window.
[X handle of confirmed artist if announced] vs. [TBD]

WaveWarZ MAIN battle. Live sets. Automatic on-chain payout.

More details: [COC Concertz URL or ZAO site]
```

ZOE posts to Farcaster /zao:
```
COC #8 is announced.

[DATE] | [VENUE]

ZOR governance vote for the MAIN battle opens [DATE - 2 weeks].
[Artist name] | vs. TBD | WaveWarZ MAIN battle on stage.

/wavewarz channel if you want to talk matchups.
```

ZOE posts to Telegram ZAO Public:
```
COC #8 is happening.

Date: [DATE]
Venue: [VENUE]

ZOR holders: governance vote for the MAIN battle opens [DATE - 2 weeks].

More details coming soon.
```

---

## ZOE Post-Launch Verification Checklist (by 11:00 AM)

- [ ] Newsletter sent (Paragraph dashboard: subscriber count sent, open rate updating)
- [ ] ZAOstock X post published — link works to live Eventbrite
- [ ] ZAOstock Farcaster cast in /zao channel
- [ ] ZABAL S2 X post published — link works to ZABAL application page
- [ ] ZABAL S2 Farcaster cast in /zao channel
- [ ] COC #8 X post published (if gate passed) OR Telegram ZAO Ops gate message sent
- [ ] ZOE logs all post timestamps to Supabase `zoe_post_log` table
- [ ] ZOE sends Telegram ZAO Ops summary: "Jul 21 launch cluster complete. [N] posts published. Newsletter: [N] subscribers reached. Eventbrite: [N] ticket views as of 11AM."

---

## Zaal's Jul 21 Checklist (Human Actions Only)

- [ ] Eventbrite listing published before 8:00AM (doc 1636 step-by-step)
- [ ] Newsletter Issue 1 approved before 8:45AM (reply "APPROVED" to ZOE in Telegram)
- [ ] COC #8 date/artist/venue confirmed to ZOE before 9:50AM
- [ ] Monitor ZAO Telegram Public for questions — respond by 12PM
- [ ] Check Eventbrite ticket sales at 12PM, 5PM, 10PM
- [ ] Share ZAOstock Eventbrite on personal channels (X personal, Farcaster personal cast)

---

## Audience Response Playbook

### If someone asks about ticket discounts (not ZAO community):

ZOE does NOT auto-respond to pricing questions. Zaal responds if asked:
```
GA tickets are $25. If you're a ZOR holder or ZABAL participant you can get the community rate ($15) — DM me and I'll send you the code.
```

### If someone asks about ZABAL S2 eligibility:

ZOE can auto-respond if message contains "zabal" + ("apply" OR "eligible" OR "can I"):
```
ZABAL S2 is open to anyone — artist or builder. Apply at [ZABAL S2 URL] by Aug 4. Program runs Sep 1–Nov 21. Questions? Drop them here or DM @bettercallzaal.
```

### If someone asks when WaveWarZ battles are:

ZOE auto-response for "when is the next battle" or "when is next MAIN":
```
Next MAIN event: COC #8 on [DATE]. Check wavewarz.info for quick battles running now. More battles drop weekly.
```

---

## Metrics to Track Jul 21-28

| Metric | Platform | Goal |
|---|---|---|
| Newsletter Issue 1 opens | Paragraph dashboard | >25% open rate |
| Eventbrite ticket sales | Eventbrite dashboard | ≥5 tickets in 7 days |
| X impressions on ZAOstock post | X Analytics | >500 |
| Farcaster /zao casts engagement | Neynar | >10 likes/recasts combined |
| ZABAL S2 application starts | ZABAL app dashboard | ≥3 in 7 days |
| ZOR holder follow-up DMs replied | ZOE log | All ZABAL DMs delivered |

ZOE compiles metrics at 5PM Jul 21 and again Jul 28. Posts summary to Telegram ZAO Ops.

---

## What If Something Fails

### Eventbrite isn't live by 9:05AM

ZOE's 9:05AM ZAOstock post is suppressed. ZOE sends Telegram ZAO Ops: "⚠️ ZAOstock Eventbrite link is not confirmed live. Skipping 9:05AM post. Send me the live URL when ready and I'll post immediately."

### Paragraph send fails

ZOE retries once (5 min delay). If second attempt fails: ZOE notifies Telegram ZAO Ops and Zaal manually sends. Backup: paste Issue 1 content into a Substack post or X thread.

### ZABAL S2 application page not live

ZOE skips ZABAL S2 posts and sends Telegram ZAO Ops: "⚠️ ZABAL S2 application page URL [URL] returned error. Confirm correct URL and I'll post when live."

---

## Related Docs

- 1636 — ZAOstock Eventbrite Listing Spec (full Eventbrite setup guide)
- 1497 — ZAO Newsletter Issue 1 Draft (paste-ready newsletter content)
- 1626 — ZABAL S2 Curriculum Spec (S2 program details for ZABAL posts)
- 1623 — COC #8 Announcement Spec (COC #8 full post templates)
- 1617 — ZAO Newsletter Launch Spec (newsletter setup + Paragraph configuration)
- 1624 — ZAO Agent Fleet Reference (ZOE posting patterns + Neynar cast pattern)
