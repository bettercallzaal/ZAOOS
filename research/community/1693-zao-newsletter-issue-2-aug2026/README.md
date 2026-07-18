---
topic: newsletter, community, zaostock, zabal
type: content-spec
status: EXECUTE SEP 1 — ZOE fills brackets Aug 31 by 10PM ET. Zaal reviews 30 min, approves by 9AM Sep 1. ZOE sends Sep 1 at 10AM ET via Paragraph. Most important newsletter issue of 2026: lineup reveal + ZABAL S2 launch.
last-validated: 2026-07-18
related-docs: 1431-zao-brief-newsletter-editorial-calendar-2026, 1617-zao-newsletter-issue-1-spec, 1467-newsletter-issue-2-predraft, 1636-zaostock-eventbrite-listing-spec, 1675-farcaster-content-calendar-sep2026, 1677-zabal-s2-zoe-weekly-ops-guide
action-owner: ZOE (draft, data-fill, send); Zaal (artist confirmation before Aug 25, personal note, approve)
send-date: 2026-09-01 10:00 AM ET
---

# 1693 — ZAO Brief Issue 2: Sep 1, 2026 — Lineup Reveal + ZABAL S2 Kickoff

> **What this is:** The full content spec for ZAO Newsletter Issue 2, per the editorial calendar (doc 1431). Sends Sep 1 — same day ZABAL S2 kicks off. This is the most consequential newsletter issue of 2026: it reveals the ZAOstock lineup, announces ZABAL S2 cohort, previews Africa Battle Week, and drives the final 50-day ZAOstock ticket push.
>
> **Predecessor:** Issue 1 (Jul 21, doc 1617). ZOE uses Issue 1's Paragraph stats (opens, clicks) to calibrate the Sep 1 send — replicate what worked, cut what didn't.
>
> **Subscriber target:** 500 subscribers by Sep 1. Issue 1 baselined from zero; all ticket buyers, ZABAL S2 applicants, and /wavewarz followers added since Jul 21 should now be subscribed. ZOE audits the list Aug 28.

---

## Issue 2 Brief

**Subject line (pick highest-open variant from Issue 1 testing):**
- Option A: `ZAOstock lineup is here. ZABAL S2 starts today.`
- Option B: `The lineup. The cohort. 32 days to ZAOstock.`
- Option C: `Sep 1: what's happening in ZAO right now`

**Preview text:** `WaveWarZ artists confirmed. ZABAL S2 cohort in session. Africa Battle Week: 21 days. Here's everything.`

**Theme:** The sprint is on. Three overlapping events (ZABAL S2, Africa Battle Week, ZAOstock) all start or accelerate in September. This issue is the signal that the year's second half has arrived.

**ZOE pre-send checklist (Aug 28-31):**
- [ ] Pull WaveWarZ battle count + SOL volume from API (updated since Issue 1)
- [ ] Confirm ZAOstock artist lineup with Zaal (locked by Aug 25 per doc 1494)
- [ ] Confirm ZABAL S2 cohort size from Supabase `zabal_s2_participants` count
- [ ] Confirm ticket sales count from ZAOstock Eventbrite dashboard
- [ ] Confirm charity name from doc 1643 (Africa Battle Week vote result)
- [ ] Pull Paragraph subscriber count (Aug 28 snapshot)
- [ ] Forward draft to Zaal by Aug 31 10PM ET for final review

---

## Full Draft (ZOE fills [BRACKETS])

---

**From:** Zaal Panthaki, The ZAO  
**Subject:** [USE WINNER FROM A/B TEST — default: ZAOstock lineup is here. ZABAL S2 starts today.]  
**Send:** Sep 1, 2026 — 10:00 AM ET via Paragraph

---

### Section 1: The Number

Since Issue 1 (Jul 21):

**[N] battles** were fought on WaveWarZ.

Losing artists earned a combined **[X] SOL** — that's **$[USD estimate at current price]** that existed because someone showed up and competed, not because they won.

Total: **[cumulative battle count] battles. [cumulative SOL] SOL wagered.** Since day one.

We're adding [N per month average] battles per month. At this pace, we hit 2,000 total battles before ZAOstock.

---

### Section 2: The Event — ZAOstock Lineup Reveal

**ZAOstock is 32 days away. Here's who's playing.**

ZAOstock 2026 — Oct 3. Ellsworth, Maine. Maine's first on-chain music festival.

**The lineup:**

[Fill from confirmed artist list — doc 1494 / Zaal confirms by Aug 25]

```
[Artist 1] — [genre, origin, WaveWarZ record if applicable]
[Artist 2] — [genre, origin]
[Artist 3] — [genre, origin]
[Artist 4] — [genre, origin]
[+ any additional confirmed]
```

**The format:**

2:00 PM – 2:30 PM: Supporting sets  
2:30 PM – 3:00 PM: Community Charity Battle (100% SOL to [CHARITY NAME])  
3:00 PM – 4:00 PM: MAIN Battle (on-chain loser-earns vote)  
4:00 PM – 5:00 PM: Closing sets

The Main Battle artist faces a live audience vote on Farcaster. ZOR holders submit their vote in real time. The loser earns from the stage.

**Tickets:**

[X] tickets remain. [ZAO Community price / GA price] at [Eventbrite URL].

If you're in the area: come. Bring someone who's never heard of WaveWarZ. The loser-earns moment is the thing. You have to watch it happen to believe it.

---

### Section 3: The Community — ZABAL Season 2

**Today is Week 1 of ZABAL Season 2.**

[N] builders and musicians. 12 weeks. Sep 1 – Nov 21.

Season 1 cohort graduated [N1] participants. They contributed [N2] ZAOOS docs and completed [N3] WaveWarZ battles. The builders shipped [brief example — pull from ZABAL S1 record if exists].

Season 2 runs at a bigger scale and a denser program:

- **Track A (Musicians):** 5+ WaveWarZ battles, an on-chain release, a governance participation
- **Track B (Builders):** 2+ ZAOOS research docs, an architecture contribution, a ZOR governance vote

The cohort decides which ZAOOS research priorities become builds. Builders implement. Musicians test it by performing on WaveWarZ.

The graduation ceremony is Nov 21. Micro-grants ($50-$200 USDC) go to participants who meet the completion criteria.

---

### Section 4: What's Coming

**Africa Battle Week: Sep 22-26**

Five days. Five Quick Battles. US-based WaveWarZ artists vs West African artists.

On Sep 26: the charity battle. 100% of SOL wagered goes to **[CHARITY NAME]** — the charity ZOR holders voted for on Jul 24-25. Payout is automatic, on-chain.

This is the first international battle week in WaveWarZ history. Artists from two continents, competing on the same platform, paid the same way.

ZOE will be posting live updates to /wavewarz on Farcaster each day Sep 22-26.

**COC Concertz #8: [DATE TBD — fill when confirmed]**

[N]th consecutive month of COC Concertz. [City]. [Artist].

Details and tickets: [URL or TBD]

---

### Section 5: Zaal's Note (Zaal writes this — 1-3 short paragraphs)

*ZOE leaves this blank. Zaal fills in his own words before approving. Suggested prompts:*

- *What surprised you most from Issue 1's response?*
- *What does ZABAL S2 starting mean to you personally?*
- *What are you most nervous and most excited about for ZAOstock?*

Keep it honest and short. The community reads the newsletter for Zaal's voice, not ZOE's data summaries. One real moment is worth three facts.

---

### Footer

You're receiving this because you're part of The ZAO community or subscribed at [Paragraph URL].

Unsubscribe: [Paragraph unsubscribe link]

Archive: paragraph.xyz/zao

Follow /wavewarz on Farcaster for live WaveWarZ updates.

---

## ZOE Send Protocol

**Aug 31:**
1. Fill all brackets using API + Supabase + Eventbrite data
2. Generate 2 subject line variants (A + B from options above) for A/B test in Paragraph
3. Send draft to Zaal via Telegram: "ZAO Brief Issue 2 draft ready — link [URL]. Need your Section 5 note by 9AM Sep 1."
4. Zaal reviews, adds personal note, replies "send" or with edits

**Sep 1:**
1. At 9:00 AM ET: confirm Zaal approval received
2. At 10:00 AM ET: send via Paragraph to full list
3. At 10:05 AM ET: post to Farcaster /zao: `ZAO Brief Issue 2 is out. [One line preview — ZAOstock lineup, ZABAL S2 start, Africa Battle Week in 21 days]. Link in bio.`
4. At 10:10 AM ET: post to ZAO Telegram: `Newsletter Issue 2 is live — [Paragraph link]`
5. Log send time + subscriber count in `/home/zaal/.zao/zoe/newsletter-log.jsonl`

**If Zaal does not approve by 9AM Sep 1:**
- ZOE holds send — does NOT send without explicit approval
- ZOE sends Zaal a Telegram reminder at 8AM: "Need your approval for the newsletter by 9AM. Link: [URL]. I can send as-is if you type 'send as-is'."
- If no response by 9:30AM: ZOE sends Zaal: "Holding newsletter send — waiting for you. Reply 'send' when ready."

---

## Key Dates for ZOE (backward from Sep 1)

| Date | Action | Owner |
|------|---------|-------|
| Aug 1 | Africa Battle Week artist lineup confirmed with RAM Africa | Zaal |
| Aug 22 | ZAOstock artist confirmations final | Zaal |
| Aug 25 | Send Zaal final artist roster for newsletter | ZOE prompts |
| Aug 28 | Pull all data (battles, tickets, ZABAL cohort size, subscriber count) | ZOE |
| Aug 31 10PM ET | Draft complete with all brackets filled, sent to Zaal for review | ZOE |
| Sep 1 9AM ET | Zaal approves (writes personal note) | Zaal |
| Sep 1 10AM ET | ZOE sends newsletter + social posts | ZOE |

---

## Sources

- `research/community/1431-zao-brief-newsletter-editorial-calendar-2026/` — issue schedule + format spec (this issue is Issue 2 per editorial calendar)
- `research/community/1617-zao-newsletter-issue-1-spec/` — Issue 1 spec; replicate structure, update content
- `research/community/1467-newsletter-issue-2-predraft/` — early predraft for what was initially Issue 2 (send date shifted to Aug 4 in that doc; this doc supersedes for Sep 1 send per editorial calendar)
- `research/events/1636-zaostock-eventbrite-listing-spec/` — ticket structure + Eventbrite URL
- `research/events/1494-zaostock-artist-booking-brief/` — artist booking brief (confirmed roster source)
- `research/zabal/1677-zabal-s2-zoe-weekly-ops-guide/` — ZABAL S2 ops (ZOE Week 1 tasks run same day as newsletter)
- `research/governance/1643-africa-battle-week-vote-results-protocol/` — charity name + wallet for Sep 26 charity battle
- `research/farcaster/1675-farcaster-content-calendar-sep2026/` — Sep 1 Farcaster posts run same day as newsletter
