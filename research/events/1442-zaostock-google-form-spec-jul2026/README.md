---
topic: events/zaostock
type: SPEC
status: READY — Zaal creates the form, ZOE monitors responses
created: 2026-07-18
owner: Zaal (creates form) / ZOE (monitors + alerts on response count)
related-docs: 1228, 1300, 1393, 1412
---

# 1442 — ZAOstock 2026 Google Form Spec

Step-by-step spec for building the ZAOstock 2026 attendee registration form. Paste these questions directly into Google Forms. Expected volume: 50-200 RSVPs. ZOE monitors the sheet and pings Zaal at milestones (25, 50, 100 responses).

**Create at:** forms.google.com → New Form  
**Share link from:** Event Eventbrite page, ZAO Telegram, X, Farcaster /cocconcertz, newsletter

---

## Form Settings (before building questions)

| Setting | Value |
|---------|-------|
| Title | ZAOstock 2026 Attendee Registration |
| Description | Exact text below |
| Response limit | None (unlimited) |
| Collect email | YES (required — for day-of updates) |
| Limit 1 response per person | YES |
| Show progress bar | YES |
| Thank-you message | Exact text below |
| Link to spreadsheet | YES (create new sheet: "ZAOstock 2026 Registrations") |
| Send confirmation email | YES (collect responder email selected above) |

**Form description (paste into Google Forms):**
```
ZAOstock is a free, one-day music and culture event in ZAOville, Maine on October 3, 2026.

WaveWarZ battles. Live music. Community-governed festival.

Free entry. This form is for planning purposes only — we'll use your email to send day-of logistics.

Questions? zaalp99@gmail.com
```

---

## Questions (in order)

### Section 1 — Who Are You

**Q1 — Name** (Short answer, Required)
> Your name or handle

**Q2 — Email** (Short answer, Required — auto-collected if "collect email" is on, but add explicitly as a backup)
> Email address for day-of updates

**Q3 — How are you connected to ZAO?** (Multiple choice, Required)
- WaveWarZ listener or voter
- ZABAL builder or participant
- COC Concertz attendee (online)
- ZAO Fractal governance participant
- I'm new — found this through social/press
- Other

**Q4 — Farcaster handle or X handle** (Short answer, Optional)
> @yourhandle on Farcaster or X (so we can tag you in the recap)

---

### Section 2 — Logistics

**Q5 — Are you planning to attend in person?** (Multiple choice, Required)
- Yes — I'll be there on October 3
- Probably yes — still confirming travel
- I'll watch the stream online
- Not sure yet

**Q6 — Where are you traveling from?** (Short answer, Optional — shown only if Q5 = "Yes" or "Probably yes")
> City, State / Country

**Q7 — Do you have any accessibility needs or dietary restrictions?** (Paragraph, Optional)
> Let us know so we can accommodate you (quiet space, seating, food allergies, etc.)

---

### Section 3 — Artist / Performer Interest (Optional Section)

Add a section header: "If you want to perform at ZAOstock"

**Q8 — Are you interested in performing at ZAOstock?** (Multiple choice, Optional)
- Yes — I'd like to be considered as a performer
- Yes — I'd like to battle in WaveWarZ on stage
- No — just attending as a fan
- Maybe — tell me more

**Q9 — If performing: your artist name and a link to your music** (Paragraph, Optional)
> Artist name + link to SoundCloud, Spotify, YouTube, or any streaming platform

**Q10 — Your genre** (Short answer, Optional — shown only if Q8 = "Yes")
> Hip hop, electronic, singer-songwriter, etc.

---

### Section 4 — Volunteer Interest (Optional Section)

Add a section header: "Help make ZAOstock happen"

**Q11 — Are you interested in volunteering?** (Multiple choice, Optional)
- Yes — I want to help run the event
- Yes — I can help with livestream / tech
- Yes — I can help with social media / documentation
- No

---

### Section 5 — How Did You Hear About ZAOstock? (for distribution analytics)

**Q12 — How did you hear about ZAOstock?** (Multiple choice, Optional)
- COC Concertz show
- X / Twitter (@bettercallzaal or @wavewarz)
- Farcaster (/zao, /cocconcertz, /wavewarz)
- ZAO Telegram
- The ZAO Brief newsletter
- A friend or community member
- Other

---

### Section 6 — Anything Else?

**Q13 — Comments, ideas, or requests** (Paragraph, Optional)
> Anything you want us to know or any ZAOstock ideas?

---

## Thank-You Message

```
You're registered for ZAOstock 2026!

Details:
📅 Date: October 3, 2026
📍 Location: ZAOville, Maine (full address coming Aug-Sep)
🎟️ Entry: Free

We'll email you day-of logistics and the livestream link closer to the date.

Follow for updates:
• X: @bettercallzaal | @wavewarz
• Farcaster: /zao | /cocconcertz
• Telegram: t.me/wavewarzclipshq

See you October 3.
— Zaal
```

---

## Post-Creation Checklist

- [ ] Test the form end-to-end with a fake entry
- [ ] Link the Google Sheet response destination (`ZAOstock 2026 Registrations`)
- [ ] Set up ZOE sheet monitoring: ping Zaal when response count hits 25, 50, 100, 150
- [ ] Add form link to: Eventbrite description, ZAO Telegram pinned message, X bio link-in-bio, newsletter Issue 1 (Jul 21 send)
- [ ] Add Eventbrite link to thank-you message once Eventbrite is live
- [ ] Share form URL in ZAOOS doc 1228 (ZAOstock runbook) notes field

---

## ZOE Monitoring Protocol

ZOE checks the spreadsheet weekly starting Aug 1:
- Count total responses
- Extract respondents who selected "Yes — I'll be there in person" or "Probably yes"
- Post weekly count to ZAO Telegram: "ZAOstock registrations: [N] total, [M] confirmed in-person"
- Alert Zaal directly if single-day signups > 20 (viral signal)
- Extract artist/performer interest list for Zaal review by Sep 1

Sheet column to monitor: `Are you planning to attend in person?` → count "Yes" + "Probably yes"

---

## North Star Impact

| Milestone | Impact |
|-----------|--------|
| 25 registrations | Proof of demand (use in press pitches) |
| 50 in-person confirmations | ZAOstock viability confirmed; mention in grants |
| 100+ registrations | GEO signal: "ZAOstock attracted 100+ registrants" |
| 5+ artist applications | Artist funnel for WaveWarZ pipeline |

**One-line press use:** "ZAOstock 2026 attracted [N] registrants as of [date] — free admission, community-governed festival."

---

*Created: 2026-07-18 | Create form: ASAP (link in Jul 21 newsletter Issue 1) | Related: 1228 (ZAOstock runbook), 1300 (post-show plan), 1412 (community infrastructure), 1432 (content calendar)*
