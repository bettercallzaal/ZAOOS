# 1472 — ZAO Telegram Community Operations Guide (Jul 2026)

**Type:** OPERATIONS-GUIDE  
**Topic:** Community  
**Status:** CANONICAL — reference for Zaal, ZOE, Iman, and any future community moderators

---

## Overview

ZAO operates two Telegram groups as of July 2026. This document is the operational guide for both: what they're for, who manages them, what ZOE posts automatically, and how humans should moderate.

---

## ZAO Telegram Groups

### Group 1: ZAO Main Telegram (Primary Community)

| Property | Value |
|---|---|
| Purpose | ZAO ecosystem news, governance updates, community discussion |
| Audience | ZAO members, ZOR holders, general community |
| Size | [Confirm with Zaal — est. 50-150 members as of Jul 2026] |
| ZOE role | Posts battle announcements, newsletter alerts, governance reminders, ZAOstock updates |
| Human owner | Zaal (admin) |
| Moderators | Iman (secondary admin) |

**Channel rules:**
1. No spam or self-promotion without Zaal approval
2. No price talk (no SOL/ETH price speculation)
3. WaveWarZ battle discussion welcome
4. Questions answered within 24 hours by Zaal or Iman
5. Governance session reminders happen every Thursday — these are ZOE-automated

### Group 2: WaveWarZ Clippers Telegram (Battle Highlights)

| Property | Value |
|---|---|
| Link | t.me/wavewarzclipshq |
| Purpose | WaveWarZ battle clips, results, artist highlights — high-signal, low-noise |
| Audience | WaveWarZ artists, traders, music fans |
| Size | [Confirm with Zaal] |
| ZOE role | Posts MAIN battle results with clip links; highlights top moments |
| Human owner | Zaal (admin) |

**Channel rules:**
1. Battle clips and results only — no off-topic discussion
2. ZOE posts MAIN results; community can post Quick battle clips
3. No price speculation or trading advice

---

## ZOE's Telegram Posting Schedule

### ZAO Main Telegram

| Trigger | ZOE Action | Template |
|---|---|---|
| MAIN battle opens | Battle announcement (doc 1385) | "🎵 MAIN BATTLE LIVE: [ARTIST_A] vs [ARTIST_B]..." |
| MAIN battle closes | Battle result | "🏆 MAIN BATTLE RESULT: [WINNER] won. Both artists earned." |
| Newsletter sends (biweekly) | Newsletter link | "📬 ZAO Brief Issue [N] is live: [URL]" |
| Thursday (weekly) | Governance reminder | "🏛️ Weekly ZAO Fractal Democracy — tomorrow [TIME]. Link: [URL]" |
| ZAOstock ticket milestone | Ticket update | "🎟️ [N] ZAOstock tickets sold! [N] left. Get yours: [URL]" |
| COC show night (T-30min) | Show alert | "🎵 COC Concertz #[N] starts in 30 minutes. RSVP: [URL]" |
| ZABAL application milestone | Count update (during Aug 1-22) | "📚 [N] ZABAL S2 applications received! Deadline: Aug 22." |

### WaveWarZ Clippers Telegram

| Trigger | ZOE Action |
|---|---|
| MAIN battle closes | Result post with top-line stats (volume, artist payouts) |
| Community Battle closes | Result + charity donation update |
| Africa Battle Week (Sep 15-26) | Daily highlight post |

---

## Posting Limits

| Channel | Max Posts/Day | Exception |
|---|---|---|
| ZAO Main Telegram | 3 (normal) / 6 (show nights) | COC show nights: up to 6 posts allowed |
| WaveWarZ Clippers | 2 (normal) / 5 (Africa Battle Week) | Sep 15-26: up to 5 daily posts |

---

## Human Moderation Guide

### What ZOE Cannot Handle

ZOE escalates these to Zaal via private DM:

1. **New member joins asking "what is ZAO?"** — ZOE flags; Iman or Zaal sends welcome message (template below)
2. **Price/investment questions** ("will ZOR go up?") — Zaal responds with governance framing: "ZOR is a governance token, not an investment. Here's how it works..."
3. **Spam or self-promotion** — Zaal or Iman removes message and warns member
4. **Critical feedback about WaveWarZ or ZAO** — Zaal responds personally within 24h; never dismisses, always acknowledges
5. **Artist asking about WaveWarZ (not just general chat)** — ZOE flags; Zaal responds with doc 1443 (artist onboarding guide) link

### Welcome Message Template (for new ZAO Main members)

```
Hey [NAME]! Welcome to the ZAO community 👋

Quick orientation:
🎵 WaveWarZ — our music battle platform (wavewarz.info)
🏛️ ZAO governance — weekly sessions, open to all ZOR holders
🎪 ZAOstock — live music festival in Ellsworth, Maine, Oct 3

You can grab a ZAOstock ticket here: [EVENTBRITE_URL]

Join a WaveWarZ battle as an artist or trader: wavewarz.info

Questions? Just ask. Zaal or Iman is usually around.
```

*ZOE note: Do NOT send this automatically. Flag new members to Iman for human welcome.*

### Handling Negative Feedback

ZAO's Telegram is a community space, not a customer service channel. Negative feedback (bad UX, slow battle close, payout issues) should be:
1. Acknowledged immediately: "Thanks for flagging this — we're looking into it."
2. Triaged: is it a WaveWarZ platform bug? → Hurricane. Is it a governance question? → Zaal. Is it a social/community issue? → Iman.
3. Resolved publicly if possible: "We fixed X — update here." Community trust is built by visible resolution, not silence.

---

## Growth Strategy for Telegram

**Current gap:** Telegram is a broadcast channel for ZAO, not a community hub. The community hub is Farcaster (/zao channel). Telegram serves ZAO's existing inner circle.

**2-phase Telegram growth plan:**

**Phase 1 (now → ZAOstock, Jul–Oct):** Don't grow the group. Keep it tight (< 200 members). Use it as the "inner circle" channel — members feel special because it's not blasted to everyone. ZAOstock attendees get invited after the event.

**Phase 2 (post-ZAOstock, Nov+):** Expand to onboard ZAOstock attendees and ZABAL S2 cohort. Target 300-500 members by Dec 2026.

**Note:** Don't post the Telegram link on every piece of content. The group's value is its signal-to-noise ratio.

---

## ZAOstock Telegram Protocol (Oct 2-4)

For the ZAOstock event weekend:

| Time | Telegram Post | Owner |
|---|---|---|
| Oct 2 (day before) | "ZAOstock is tomorrow! Full details: [URL]" | ZOE |
| Oct 3 9AM | "Doors open 12PM today! Drive safe — see you at the Parklet." | ZAAL |
| Oct 3 1PM | "ZAOstock is live! WaveWarZ battle starts at [TIME]." | ZOE |
| Oct 3 live | "WaveWarZ LIVE on stage right now! Vote at wavewarz.info" | ZOE |
| Oct 3 close | "ZAOstock wrap! [N] people in person, [N] online, [CHARITY_TOTAL] to charity." | ZAAL |
| Oct 4 | ZAOstock Mirror Article 2 link (doc 1418) | ZOE |

---

## ZOE Configuration Notes

**Telegram Bot:** ZAO operates a dedicated Telegram bot for automated posts. The bot token must be renewed if it expires. Hurricane or Zaal holds the token.

**WaveWarZ Clippers Bot:** Separate bot instance for t.me/wavewarzclipshq. Operates independently from ZAO Main bot.

**Rate limiting:** Telegram Bot API has a rate limit of 30 messages/second and 20 messages/minute per group. ZOE's posting cadence is well below this limit.

**Message editing:** ZOE can edit messages within 48 hours of posting. Use this for stat corrections or URL updates.

---

## Zaal's Personal Telegram Use

Zaal posts personally in ZAO Main Telegram when:
- Sharing a major ZAO decision or news item (governance vote outcome, COC #8 date lock)
- Responding to critical questions that need his voice
- ZAOstock show day wrap post (always personal — never ZOE)

Zaal does NOT:
- Post in WaveWarZ Clippers manually (that's ZOE's domain)
- Reply to routine questions that ZOE or Iman can handle
- Post battle announcements manually (always ZOE)

---

## Related Docs

- 1412 — ZAO Community Infrastructure Map (all channels overview)
- 1468 — ZOE Daily Operations Manual (full ZOE config and schedule)
- 1385 — ZOE Social Media Playbook (template library)
- 1371 — COC Show-Night Live Social Playbook
- 1456 — ZAO Jul 21-25 Announcement Wave Playbook
- 1412 — ZAO Community Infrastructure Map (channel health status)
