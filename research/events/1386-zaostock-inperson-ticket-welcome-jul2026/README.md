---
topic: events/zaostock-operations
type: TEMPLATE
status: ACTIVE — configure in Eventbrite/Mailchimp before Jul 21 launch
created: 2026-07-17
related-docs: 1365, 1379, 1375, 1383
owner: Zaal (configure) + ZOE (auto-send)
---

# 1386 — ZAOstock In-Person Ticket Buyer Welcome Sequence (Jul 2026)

> **What it is:** 5 emails sent automatically to every in-person ZAOstock ticket buyer, from confirmation through post-event VOD. Paste into Eventbrite's automated email system or Mailchimp. Pairs with doc 1379 (virtual attendee kit) to cover both buyer types.
>
> **Configure before Jul 21 (Eventbrite launch).** All copy is ready — fill the bracketed placeholders and paste.

---

## Email 1 — Immediate Confirmation (Send: instantly on purchase)

**Subject:** You're going to ZAOstock — Oct 3, Ellsworth ME 🎵

---

Hey [first name],

Your ticket is confirmed. **ZAOstock is October 3, 2026 in Ellsworth, Maine.**

Here's what you just unlocked:

**The ZAO's first major music festival.** 8 artists selected by community battle history — not by a label, not by a booking agent. The community voted. These artists earned their spot.

**What to expect:**
- Live music performances across the day
- WaveWarZ live battle mid-show (community votes in real time)
- Charity fundraising moment on stage
- The ZAO community IRL — the people behind 63+ weeks of governance sessions

**Your ticket:** Hold onto this email. We'll send your final entry details closer to the show.

**Tell someone.** If you're bringing friends, forward them this link: [Eventbrite link]

Questions? DM @bettercallzaal or email zaalp99@gmail.com.

See you October 3.

— Zaal Panthaki
Founder, The ZAO

---

## Email 2 — 30 Days Before (Send: September 3)

**Subject:** ZAOstock is 30 days away — here's what to know

---

Hey [first name],

ZAOstock is exactly one month away. Here's your prep guide.

**WHEN:** Saturday, October 3, 2026

**WHERE:** [Venue address — fill from permit doc 1285]

**PARKING:** [Fill from venue confirmation]

**WHAT TO BRING:**
- Your ticket (this email or the Eventbrite app)
- Cash or card for merch
- Appetite for live music
- Your phone — you'll want photos

**WHAT'S HAPPENING:**
- [Artist 1], [Artist 2], [Artist 3], [Artist 4], [Artist 5], [Artist 6], [Artist 7], [Artist 8] performing live
- WaveWarZ live battle — you vote in real time on your phone (wavewarz.info)
- On-stage charity moment for [charity name from doc 1384]
- ZAO community IRL

**LINEUP UPDATE:** Full lineup reveal goes out September 1 in our newsletter. Subscribe if you haven't: [newsletter link]

**MERCH:** ZAOstock gear available at the show. Limited quantities.

See you in 30 days.

— Zaal

---

## Email 3 — Week Before (Send: September 26)

**Subject:** ZAOstock is ONE WEEK away — full lineup inside

---

Hey [first name],

One week. Here's everything you need.

**LINEUP (CONFIRMED):**
1. [Artist 1]
2. [Artist 2]
3. [Artist 3]
4. [Artist 4]
5. [Artist 5]
6. [Artist 6]
7. [Artist 7]
8. [Artist 8] (headliner / ZABAL Games winner)

**SCHEDULE (approximate):**
- [Time]: Doors open
- [Time]: First performance
- [Time]: WaveWarZ live battle (bring your phone)
- [Time]: Charity push on stage
- [Time]: Headliner
- [Time]: Show ends

*Full schedule at [link or social handle]*

**WHERE TO STAY:**
Nearby options in Ellsworth ME:
- [Hotel 1 — Zaal researches and adds]
- [Hotel 2]
- [AirBnB search link for Ellsworth ME]

**PARKING:** [Confirm from venue — add specific instructions]

**DAY-OF CONTACT:** If you have questions day-of, DM @bettercallzaal on X

See you next Saturday.

— Zaal

---

## Email 4 — Day Before (Send: October 2)

**Subject:** ZAOstock is TOMORROW — everything you need to know

---

Hey [first name],

Tomorrow is ZAOstock.

**TOMORROW:**
- **Date:** Saturday, October 3
- **Address:** [Venue address]
- **Doors:** [Time]
- **Ends:** [Time]

**YOUR TICKET:** Show this email at the door or have your Eventbrite QR code ready.

**DON'T FORGET:**
- [ ] Phone (you'll vote in the WaveWarZ live battle)
- [ ] Your ticket confirmation
- [ ] Cash for charity + optional merch
- [ ] Good mood

**WEATHER:** [Check forecast for Ellsworth ME Oct 3 — add note]

**DIRECTIONS:** [Link to Google Maps for venue address]

**TONIGHT:** We're posting the final hype lineup on @wavewarz — follow along.

See you tomorrow.

— Zaal

---

## Email 5 — Post-Event Thank You (Send: October 5, 2 days after show)

**Subject:** ZAOstock recap — thank you for being there

---

Hey [first name],

Thank you for coming to ZAOstock.

**What happened:**
- [N] people showed up (live + virtual)
- [N] performances across the day
- WaveWarZ live battle: [WINNER] won — [N] votes cast by the audience
- Charity: [org name] received $[amount] from ZAOstock ticket proceeds
- WaveWarZ battle stats during ZAOstock: +[N] battles, [SOL] volume

**Watch it again:** Full show VOD is live → [YouTube link]

**Join The ZAO community:**
- Newsletter (400+ editions, weekly builds in public): [Paragraph link]
- Farcaster /zao: [link]
- Telegram: [t.me/wavewarzclipshq]

**Next up:**
- ZAOstock Year 2 is being planned. If you want to stay in the loop, you're already on this list.
- COC Concertz Season 2 continues monthly — next show [date/link]
- WaveWarZ battles run daily — submit a track at wavewarz.info

If ZAOstock meant something to you, share the VOD with someone who wasn't there. That's how The ZAO grows.

— Zaal Panthaki
Founder, The ZAO | thezao.xyz

---

## Configuration Checklist (Zaal — complete by Jul 21)

**In Eventbrite:**
- [ ] Set Email 1 as confirmation email (default — customize the Eventbrite confirmation template with above copy)
- [ ] Eventbrite doesn't support automated sequences beyond confirmation → use Mailchimp for Emails 2-5

**In Mailchimp (or equivalent):**
- [ ] Add all in-person ticket buyers to a "ZAOstock In-Person" list (Eventbrite → Mailchimp integration or manual export)
- [ ] Create automation: trigger on list join → send sequence at delays below:
  - Email 2: send Sep 3 (30 days before)
  - Email 3: send Sep 26 (7 days before)
  - Email 4: send Oct 2 (1 day before)
  - Email 5: send Oct 5 (2 days after)
- [ ] Fill all bracketed placeholders before activating automation

**Placeholders to fill:**
- [ ] Venue address (from permit doc 1285)
- [ ] Show start/end times (from doc 1336)
- [ ] Artist lineup (from doc 1313 — fill by Sep 1 newsletter)
- [ ] Parking instructions (from venue)
- [ ] Charity partner name (from doc 1384 — confirm by Jul 31)
- [ ] Hotel recommendations (research Ellsworth ME)
- [ ] Post-show: VOD link, donation total, battle stats (fill Oct 4-5)

---

## Integration with Virtual Attendee Kit (Doc 1379)

In-person buyers → **this doc** (Emails 1-5 above)
Virtual buyers → **doc 1379** (separate 5-email sequence)

Both sequences end at Email 5 (post-event recap) with:
- VOD link
- ZAO community invite
- Next events

The community invite email (Email 5) is the same for both — both in-person and virtual attendees join the newsletter + Farcaster /zao + Telegram.

---

## Growth Integration

**Newsletter:** Every in-person ticket buyer should be added to the ZAO newsletter (Paragraph). Add a checkbox at Eventbrite checkout: "Subscribe to The ZAO newsletter (weekly builds in public)" — pre-checked.

**Target:** In-person tickets → +100-200 newsletter subscribers (converting ~50-75% of in-person buyers)

This feeds the newsletter growth model in doc 1377 (500 → 750 by Oct 5).

---

*Created: 2026-07-17 | Configure by Jul 21 | Fill set times/lineup by Sep 1 | Fill post-event stats Oct 4-5 | Related: 1379 (virtual kit), 1365 (Eventbrite), 1375 (social calendar), 1383 (artist guide), 1384 (charity brief)*
