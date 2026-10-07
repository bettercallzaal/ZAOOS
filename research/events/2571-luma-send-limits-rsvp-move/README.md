---
topic: events
type: decision
status: decided
last-validated: 2026-09-28
superseded-by:
related-docs: "events/901-luma-july-build-days, infrastructure/2099-one-event-three-surfaces"
original-query: "reveiw this and /zao-research - [pasted DM thread: 'Luma charges $70/month to re-invite past guest' / 'why does it cost so much to send an email lol' / 'Frfr' / '@bettercallzaal is my main username / founder' / 'I'll peep this after the patriots play !' / 'Reviewing this morning before our call' / 'Excited to move our stuff over and push this rsvp']"
tier: STANDARD
---

# 2571 - Luma send limits, and whether to move ZAO RSVPs off Luma

> **Goal:** Check the "$70/month to re-invite past guests" claim from a vendor DM, and decide what (if anything) moves off Luma, given ZAOstock is on Oct 3, 2026.

## Outcome (2026-09-28, after the call)

**The vendor is Towns Of** (townsof.com, Instagram @towns_of). Zaal had the call and decided: **use Towns Of alongside Luma, not instead of it**, to grow future events. In Zaal's words it is "basically a free luma", and the founder offered to hear ZAO feature requests.

- Org created: townsof.com/org/zao-festivals (organizer review was pending at creation).
- ZAOstock Oct 3 RSVP stays on Luma via `ticket.zaostock.com`. Decision 1 below holds.
- Open item from the onboarding screens: discovery is "only offered to event hosts who exclusively run their registration through our platform". Running both means ZAO events may not appear in Towns Of discovery. Confirm per-event vs per-org.
- Towns Of pricing was not published on its site (JS shell, curl 2026-09-28); "free" is from the call, not a page.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **DO NOT move the ZAOstock RSVP before Oct 3.** | Festival is 5 days out (measured `date` 2026-09-28). `ticket.zaostock.com` 302s to the Luma RSVP (`zaostock/src/content/festival.ts:53`, `src/app/tickets/page.tsx:9`), and that URL is already in the press kit, posters and `/tickets`. Moving it now splits the guest list across two systems for the one event that matters. |
| 2 | **The "$70/month to re-invite" claim is half true.** Correct it before the call. | Luma Plus is $59/mo billed annually, "save 14%" vs monthly, so about $69/mo monthly (derived, not printed). But the FREE plan on a verified calendar already sends **500 invites/week**. Only lists over 500 need Plus. Messages to people already registered are **unlimited on any plan**. |
| 3 | **Re-invite past guests for free now:** verify the calendar, tag past guests into groups of 500 or fewer, send one tag per week. | Luma's own send-limits page names this exact workaround. A send larger than the remaining limit errors out whole, it does not partial-send. |
| 4 | **Export the Luma guest list to CSV now, whatever is decided.** | CSV import/export is on the free plan. It makes any later move cheap and keeps the list in ZAO hands. |
| 5 | **Evaluate the vendor for post-festival events only** (ZABAL Gamez, COC Concertz, ZAO calendar), starting after Oct 4. | A move is a real option once the festival is done. It is not a 5-day option. |
| 6 | **SKIP the Luma non-profit discount as the fix.** | It is 40% off Plus, but The ZAO is not itself a non-profit or fiscally sponsored (Fractured Atlas sponsors New Media Commons, not The ZAO). Do not claim it. |

## Findings

### Towns Of walkthrough (2026-09-28, logged in as info@thezao.com via Claude in Chrome; logged-out view via gstack browse)

| Area | Found | Why it matters |
|------|-------|----------------|
| Orgs | Two: **The ZAO** (Maine) with Events, Audience, Roles, Tickets, Insights, Display, Forms; **ZAO Festivals** (Ellsworth) with only Events, Audience, Display | ZAO Festivals looks unapproved; The ZAO has the full toolset |
| ZAOstock event | Exists under ZAO Festivals, Public, 0 RSVPs, tags Music / Community / Family Friendly / Outdoors, share link `share.townsof.com/e/hhcp82bwk0n` | Live to logged-out visitors with a One-click RSVP button, so it can split RSVPs from Luma |
| Location | "No location set" in manager, "TBD" on the public page | Fix before sharing: Franklin Street Parklet, Ellsworth |
| Description | Renders, but the closing date / place / URL lines collapse into one line | Cosmetic; zaostock.com is not a link |
| Invites | Three sources: Your Community, Past Events, Add Emails (paste or CSV import). No send limit shown in the UI | The "re-invite past guests" pitch is real in the product; limit unverified |
| Export | Audience tab has "Download community list" | Guest list is portable |
| Registration | Name + email required, custom questions, saveable templates, community forms | |
| Tickets | Free or paid tiers via Stripe, coupon codes; homepage says 0% fees | |
| Embed | iframe `townsof.com/embed/e/<id>`, 560px, card + RSVP button | Could sit on a zaostock.com page |
| Collab | Add Collaborator (another community), Add Host, Transfer event between orgs | The ZAO could co-host ZAO Festivals events |
| Roles (The ZAO) | Owner info@thezao.com; Manager role available | Iman can be added as Manager |
| Insights (The ZAO) | Events, RSVPs, ticket sales, 7-day page views; all 0 | |
| Discover | States: NJ, PA, MA, NY, TN, GA, RI, plus "Suggest a location". **No Maine** | Discovery brings no Ellsworth audience today |

### What Luma actually limits (measured 2026-09-28)

| Plan | Weekly invite + newsletter sends | Price | Notes |
|------|------|------|------|
| New / unverified calendar | 15 | Free | Even a Plus calendar is capped at 15 until verified |
| Free, verified | 500 | Free | Unlimited events, unlimited guests, blasts to registered guests, CSV import/export, 3 admins |
| Luma Plus | 5,000 | $59/mo annual, ~$69/mo monthly | 0% platform fee on paid events (vs 5%), 5 admins, Zapier + API |
| Plus add-on | 10,000 / 25,000 / 50,000 / 100,000 | +$50 / $200 / $400 / $800 per mo | Billed annually |
| Extra admin seat | - | $12/mo ($9 annual) | |

What costs money is **cold sends above 500/week**, not email in general. Registrations are always unlimited. Blasts and reminders to people who already said yes are unlimited. So "why does it cost so much to send an email" is true only for a re-invite list over 500 in one week.

### What ZAOstock runs today

- Free RSVP: Luma, reached through `ticket.zaostock.com` (302) and the branded `/tickets` door (`zaostock/src/app/tickets/page.tsx`). A test forbids a raw `luma.com` link on that page (`src/app/tickets/tickets.test.ts:70-73`).
- A second, ZAO-owned RSVP path already exists: `POST /api/events/rsvp` writes to the Supabase `rsvps` table (`zaostock/src/app/api/events/rsvp/route.ts`), used by `RSVPForm.tsx` and the team dashboard `RsvpList.tsx`. So "own the list" is partly built already, independent of any vendor.

### Community read

HN comments place Luma and Partiful as the default for new community events ([37758449](https://news.ycombinator.com/item?id=37758449)), and name repeat attendance as the unsolved problem for organizers ([40731834](https://news.ycombinator.com/item?id=40731834)). That is the gap a vendor pitching "re-invite past guests" is aiming at. No community thread found on Luma's send limits specifically (searched HN Algolia comments for "lu.ma" + pricing/invite terms; Reddit not searched this pass).

## Questions for the call

1. What is the platform's name, and what does sending to 1,000 or 5,000 past guests cost there, per month?
2. Can we import our Luma CSV with RSVP history intact, and export ours back out any time?
3. Do they do free RSVP with a branded URL (we need `ticket.zaostock.com`-style redirect)?
4. Check-in on the day: app, QR, offline?
5. What happens to guests who registered on Luma, do they get double emails?

## Also See

- [events/901-luma-july-build-days](../901-luma-july-build-days/) - Luma blasts, clone + recurrence
- [infrastructure/2099-one-event-three-surfaces](../../infrastructure/2099-one-event-three-surfaces/) - Luma is one-way; create there by hand

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| DONE 2026-09-28 - call held; Towns Of adopted alongside Luma, ZAOstock RSVP stays on Luma. | @Zaal | Call | 2026-09-28 |
| Send Towns Of a written feature-request list (branded link / custom domain, CSV export, discovery rules when also on Luma). Shipped = list sent in the DM. | @Zaal | DM | 2026-10-10 |
| Decide the ZAOstock Towns Of listing: either set location + point RSVP to ticket.zaostock.com, or set it unlisted, so RSVPs do not split from Luma. Shipped = listing shows Franklin Street Parklet and one RSVP path. | @Zaal | Task | 2026-09-29 |
| Ask Towns Of to add Maine to Discover and approve ZAO Festivals. Shipped = Maine chip live on /discover. | @Zaal | DM | 2026-10-10 |
| Run the first post-festival ZAO event on Towns Of and compare RSVPs from its discovery vs Luma. Shipped = RSVP counts noted in this doc. | @Zaal | Event | 2026-10-31 |
| Export ZAOstock Luma guest list to CSV and store it in the vault (not a public repo). Shipped = CSV file exists in vault. | @Zaal | Task | 2026-09-30 |
| Confirm the ZAO Luma calendar is verified (500/week, not 15). Shipped = verified badge seen in Calendar settings. | @Zaal | Task | 2026-09-30 |

## Sources

- [Luma pricing](https://luma.com/pricing) [FULL, method: curl + HTML strip, 2026-09-28] - $59/mo annual "save 14%", add-on table, free-plan feature list
- [Luma Help - Send Limits](https://help.luma.com/p/send-limits) [FULL, curl] - 15 / 500 / 5,000 per week, verification rule, no partial sends, unlimited messages to registered guests
- [Luma Help - Luma Plus Overview](https://help.luma.com/p/luma-plus) [FULL, curl] - 0% vs 5% fee, admin seats $12/$9
- [Luma Help - Luma for Non-Profits](https://help.luma.com/p/luma-for-non-profits) [FULL, curl] - 40% off Plus
- [Luma Help - Inviting and Adding Guests](https://help.luma.com/p/inviting-and-adding-guests-to-your-event) [FULL, curl] - invite by contact tags
- [HN comment 37758449](https://news.ycombinator.com/item?id=37758449) [FULL, HN Algolia API] - Luma + Partiful as default
- [HN comment 40731834](https://news.ycombinator.com/item?id=40731834) [FULL, HN Algolia API] - repeat attendance unsolved
- Pasted DM thread from Zaal, 2026-09-28 [FULL as pasted]
- Towns Of onboarding screens, screenshots from Zaal 2026-09-28 [FULL as shown] - org dashboard, CSV + past-event invites, discovery exclusivity rule, organizer review
- [townsof.com](https://townsof.com) [FAILED - curl returns a JS shell with title only; no pricing page readable]
- Call outcome, Zaal in chat 2026-09-28 [FULL as reported]
- Monthly Luma Plus price [PARTIAL - $69 derived from $59 and "save 14%"; the monthly figure sits behind a JS toggle and was not read directly]
