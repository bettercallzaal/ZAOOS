# 472 - ZAOstock Artist Lockin Timeline (Internal Proposal)

> **Status:** Internal proposal, not for public comms yet
> **Date:** 2026-04-21
> **Goal:** Propose a full lockin timeline for the Oct 3 artist lineup. Came from the Apr 21 meeting where Zaal committed to the "1 month before or your spot goes" policy.

---

## The Policy (proposed)

If an artist is not fully locked in (contract + tech rider + travel confirmed + bio submitted) by **September 3, 2026** (exactly one month before Oct 3), their slot goes to someone else.

No exceptions - not even for friends. This is the biggest festival-killer: flaky artist bookings. We eliminate the pattern by making the rule clear up front.

---

## Full Timeline (artist milestones)

| Milestone | Target date | Who owns | Trigger |
|-----------|------------|----------|---------|
| First-contact window closes | May 15 | DCoop + Zaal | Every wishlist artist must have been pitched at least once |
| Interested-confirmation window | June 1 | DCoop | Every "contacted" artist replied yes or no |
| Confirmed list v1 published | June 30 | Zaal | Half-lineup reveal on @ZAOfestivals |
| Contracts issued | July 1-15 | Tyler + Zaal | Simple partner agreement + Fractured Atlas W-9 process |
| Contracts signed | August 1 | Artists | No signed contract = no set |
| Tech riders submitted | August 15 | Artists | Gear, audio, any specific asks |
| Travel locked (for travel-booked artists) | August 31 | Zaal + artist | Flights / hotels booked |
| Logos + promo assets delivered | September 1 | Artists | Brand pack for poster + stage + broadcast |
| **LOCKIN DEADLINE** | **September 3** | Artist | All above items done or slot reopens |
| Final run-of-show locked | September 10 | Zaal + DCoop + Hurric4n3 | Time slots assigned in dashboard |
| Attendee-facing lineup reveal | September 15 | Zaal + DaNici | Full poster + program live |
| Final tech + stage plan | September 20 | Zaal + vendor | Wallace Events tent, audio, power |
| Artist day-of comms | September 30 | Zaal | Load-in times, parking, contact |
| Festival | October 3 | Everyone | Execute |
| Recap + pay artists | October 10-17 | Tyler | Post-event payout |

---

## Soft deadlines (not fireable offenses)

- Submitting a bio: within 2 weeks of first yes
- Social handle share: within 2 weeks of first yes
- Bio edits requested: up to September 15

---

## Firing offenses (hard deadlines)

- **August 1:** No signed contract -> slot reopens
- **August 15:** No tech rider -> slot reopens (unless vendor intervention)
- **September 3 (master deadline):** Any missing item from the lockin list -> slot reopens

Why this works: artists who show up on August 1 with a signed contract are the ones who show up on October 3. Flakes filter themselves out naturally when you set the expectation clearly.

---

## Replacement Queue

Track a wishlist of "backup artists" in the dashboard with status=wishlist. If a slot reopens, pull from the wishlist in order of pipeline priority. Dashboard filter: `status=wishlist AND cypher_interested=true` is a good first-pull heuristic.

---

## What to communicate publicly

Nothing about the policy directly. Instead:
- "We have a 10-artist lineup for Oct 3"
- "Full lineup dropping September 15"
- "Tickets drop once lineup is public"

The internal deadlines keep us sane. The public just sees clarity and execution.

---

## Dashboard integration

- Add timeline milestones to the `stock_timeline` table keyed to these dates
- Dashboard Artists tab: add a "Lockin risk" column (red/yellow/green based on which milestones they've hit)
- Automatic Pareto "Top 3" for artists: sorted by how many lockin milestones they've missed

---

## Next steps

1. Tuesday Apr 28 meeting: present this to the team for feedback
2. DCoop + Zaal: review together before the meeting
3. Seed milestones into `stock_timeline` with dates above
4. Add "Lockin risk" visual to dashboard Artists tab as a follow-up build

---

## Sources

- Apr 21 meeting transcript: Zaal said "if a month before you are not locked in and signed up, like we're moving your spot to someone else, even if you're a friend."
- Industry standard: most touring artists lock 60-90 days out; we're giving 30 because we're small
- Precedent: ZAOCHELLA and PALOOZA lineup formation timelines
