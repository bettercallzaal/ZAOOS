---
topic: identity/newsletter
type: CALENDAR
status: ACTIVE — ZOE pre-fills issue drafts; Zaal reviews + sends
created: 2026-07-17
related-docs: 1270, 1329, 1336, 1347
owner: ZOE (drafts) + Zaal (review + send)
---

# 1377 — ZAO Newsletter Q3 Content Calendar (Jul–Oct 2026)

> **Context:** The ZAO newsletter on Paragraph.com/@thezao has 400+ editions and 78 paid supporters (doc 1270). This calendar maps 5 planned issues for the ZAOstock build-up (Aug–Oct), so ZOE can pre-draft and Zaal just reviews before sending. Each issue has a clear arc: building anticipation → event → follow-up.
>
> **Cadence:** ZAO newsletter publishes daily in "build-in-public" mode (doc 1270). These 5 are the ANCHOR issues — the newsletter issues that matter most for growth and press. Daily cadence continues between them.

---

## Issue Overview

| # | Issue title | Send date | Main CTA | Audience target |
|---|-------------|-----------|----------|-----------------|
| Issue 1 | The ZAOstock Insider Series Begins | Aug 1 | Buy tickets | Existing subscribers + ZAO community |
| Issue 2 | Artist Reveal: Meet the ZAOstock Lineup | Sep 1 | Share artist spotlight | Existing subscribers + artist fanbases |
| Issue 3 | 30 Days to ZAOstock | Sep 3 | Last-chance ticket push | All subscribers + share ask |
| Issue 4 | ZAOstock is Tomorrow | Oct 2 | Join the stream | All subscribers |
| Issue 5 | ZAOstock: What Happened (Full Report) | Oct 5 | Annual report preview | All subscribers + media |

---

## Issue 1: "The ZAOstock Insider Series Begins" (Aug 1)

**Why this date:** Eventbrite goes live Jul 21. By Aug 1, tickets are live and artist reveal season begins. This is the first big newsletter moment.

**Subject:** ZAOstock insider series: issue 1

**Lead:** Tickets are live. Here's what you need to know before everyone else does.

**Body sections:**
1. **What ZAOstock is** (2 paragraphs): First festival where every artist earned their slot through community governance. Oct 3, Ellsworth, Maine. 200–300 expected. Virtual stream available.
2. **Ticket options** (brief): $15 GA / $20 door / $10 virtual / $5 charity add-on
3. **Why the lineup is different** (1 paragraph): ZOE pulls WaveWarZ API to show each artist's battle count + SOL earned. "These aren't people we booked. These are people who won."
4. **What's coming in the next 5 weeks** (preview of artist reveals, sponsor announcements, behind-the-scenes)
5. **CTA:** Get your ticket now: [Eventbrite link] | Forward to someone who needs to be there

**ZOE pre-fill tasks:**
- Pull current WaveWarZ stats (battles, SOL volume) from API
- Pull ticket count from Eventbrite if available (ask Hurricane for API access)
- Confirm charity partner name (from doc 1357, due Jul 25)

---

## Issue 2: "Artist Reveal: Meet the ZAOstock Lineup" (Sep 1)

**Why this date:** Artist reveal season (doc 1313) peaks Sep 1–Sep 12 leading to full lineup drop. This issue accelerates the reveals.

**Subject:** ZAOstock lineup reveal — all 8 artists, their stories, and what they earned to be here

**Lead:** The lineup is set. Here's every artist, why they're on this stage, and the battle record that got them there.

**Body sections:**
1. **How the lineup was chosen** (1 paragraph): WaveWarZ battle history, not booking agents. Cross-reference doc 1313 for narrative.
2. **Artist-by-artist feature** (8 mini-features, 2-3 lines each): [ARTIST 1]: [Battle count] battles, [SOL] earned. From [location]. Playing [genre/style]. [One sentence hook from doc 1369 artist bio.]
   - Repeat for all 8
3. **Artist social tags**: For each artist, include X handle (ZOE can pull from doc 1369 artist info requests)
4. **Forward ask**: "Send this to an artist you think should be at ZAOstock 2027. They need to start their WaveWarZ journey now."
5. **CTA:** Tickets still available: [Eventbrite link] | Buy a virtual ticket for $10

**ZOE pre-fill tasks:**
- Pull all 8 artist names and handles from doc 1369 (artist info due Sep 1)
- Pull each artist's WaveWarZ stats (battles + SOL) from /api/public/stats by handle
- Confirm set order from doc 1336 (locked Sep 12 — send issue on Sep 1 before exact set times locked)

---

## Issue 3: "30 Days to ZAOstock" (Sep 3)

**Why this date:** 30-day countdown starts Sep 3. Last-chance ticket urgency begins.

**Subject:** 30 days to ZAOstock — here's where things stand

**Lead:** One month from today, 8 artists take the stage in Ellsworth, Maine. Here's the current state of play.

**Body sections:**
1. **Current ticket count** (honest report): [N] tickets sold. [N] virtual. [N] available. "We're on track for [N] in-person — here's what we need to hit 200."
2. **Livestream details**: YouTube + Twitch, free to watch. Virtual ticket ($10) gets email updates and exclusive pre-show access. Link.
3. **Charity update**: $[amount] raised so far for [charity name]. Add $5 to your ticket.
4. **ZAOstock week preview**: Oct 2 early arrivals (Acadia, Ellsworth) + Oct 3 main day.
5. **Call to share**: "If 30 people who read this forwarded it to one friend, we'd fill the venue."
6. **CTA:** Share this issue | Ticket link | Virtual ticket link

**ZOE pre-fill tasks:**
- Pull ticket count from Eventbrite
- Pull charity total from doc 1357 integration
- Auto-format the "tickets sold" section

---

## Issue 4: "ZAOstock is Tomorrow" (Oct 2)

**Why this date:** Night before. Maximum energy, last-chance moment.

**Subject:** ZAOstock is tomorrow ✓

**Lead:** October 3 is here. Here's everything you need for tomorrow.

**Body sections:**
1. **If you're coming in person**: Venue address, parking, load-in time for VIPs, gates open time
2. **If you're watching online**: Stream link (YouTube + Twitch), stream start time, what to expect
3. **Charity final push**: "The donation jar closes at the end of the night. Last chance."
4. **The lineup one more time**: 8 artist names + set times (locked from doc 1336)
5. **What to look for**: "Watch for the WaveWarZ live battle mid-show. It'll be the loudest moment."
6. **CTA:** Stream link | Venue directions | Final ticket link (door sales at $20)

**ZOE pre-fill tasks:**
- Pull final set times from doc 1336 (confirmed by Sep 26)
- Add YouTube + Twitch stream links (confirmed by Oct 1)
- Add final ticket count (for drama: "X tickets left at the door price")

---

## Issue 5: "ZAOstock: What Happened" (Oct 5)

**Why this date:** 2 days after the event. VOD available. Photos in. Numbers pulled.

**Subject:** ZAOstock 2026 — here's what happened

**Lead:** ZAOstock is done. Here's every number, every story, and what it means for Year 2.

**Body sections:**
1. **The headline numbers** (stat block):
   - Artists performed: 8
   - In-person attendance: [N] (actual)
   - Live stream viewers: [N] (actual, pull from YouTube analytics)
   - Charity raised: $[amount] for [partner]
   - WaveWarZ battles during event: [N]
   - Total WaveWarZ volume to date: [N] SOL
2. **What worked** (2-3 paragraphs): Honest assessment from Zaal
3. **VOD link**: Full replay available at [YouTube link]
4. **What's next**: ZAOstock Year 2 planning (Oct–Dec), ZABAL S2 closes Nov, COC #9 coming, annual report Dec
5. **Newsletter exclusive**: "I'm writing the full 2026 annual report for Dec 15 — subscribers get it first."
6. **CTA:** Watch the VOD | Forward this | Subscribe for the annual report

**ZOE pre-fill tasks:**
- Pull all final event numbers from doc 1336 (night-of capture) and doc 1337 (post-event template)
- Pull YouTube analytics 48hrs after stream
- Pull WaveWarZ API for final battle count during event window
- Draft sections 1-2 from raw data; Zaal writes sections 3-4

---

## Between-Issue Daily Cadence (ZOE handles)

Between the 5 anchor issues, ZOE maintains the daily build-in-public cadence. Focus themes by month:

**August (Aug 1–31):**
- WaveWarZ MAIN event results (after each event)
- ZABAL Games August Finals countdown
- ZAOstock artist spotlight (1 per week, from doc 1313 schedule)
- Fractals governance recap (weekly)
- Partner announcements (as confirmed from doc 1368 outreach)

**September (Sep 1–Sep 30):**
- Full lineup drop Sep 12 (major post)
- Ticket countdown milestones (100 sold, 150 sold, etc.)
- Ellsworth local coverage (forward any Ellsworth American or WERU coverage)
- Charity partner spotlight (from doc 1357)
- Stream technology preview (what to expect on YouTube + Twitch)

**October 1–3:**
- Daily countdown posts
- Behind-the-scenes artist prep
- Load-in day Oct 2 recap (if Zaal can write)
- ZAOstock Day of Oct 3 → covered by doc 1375 social calendar

---

## Newsletter Subscriber Growth Goals (ZAOstock Effect)

Per doc 1347, target: 500 → 1,000 newsletter subscribers by Dec 2026.

ZAOstock is the single biggest subscriber acquisition event:

| Mechanism | Expected new subscribers |
|-----------|------------------------|
| Virtual ticket purchasers (email required) | 50–100 |
| ZAOstock.com email capture on stream page | 30–75 |
| Artist fanbase cross-subscribe | 25–50 |
| Press coverage → link to newsletter | 10–30 |
| Forward-to-friend from Issue 5 | 20–50 |
| **Total ZAOstock window** | **135–305** |

Target: 750 subscribers by Oct 5, 1,000 by Dec 31.

---

## ZOE Newsletter Draft Protocol

For each of the 5 anchor issues:
1. **T-minus 7 days:** ZOE creates a draft in Paragraph with all placeholders marked [FILL]
2. **T-minus 3 days:** ZOE fills all placeholders from API data + doc references
3. **T-minus 1 day:** Zaal reviews + edits voice + hits "publish" (or schedules)
4. **Send day:** ZOE posts Farcaster + X announcement with issue link

---

*Created: 2026-07-17 | 5 anchor issues Aug 1 → Oct 5 | ZOE pre-drafts 7 days ahead | Related: 1270 (newsletter canonical), 1313 (artist reveal calendar), 1329 (marketing plan), 1336 (day-of runbook), 1347 (subscriber growth), 1375 (day-of social calendar)*
