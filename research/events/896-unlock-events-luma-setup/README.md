---
topic: events
type: guide
status: research-complete
last-validated: 2026-06-24
superseded-by:
related-docs:
original-query: "https://unlock-protocol.com/guides/ check here how to add it: https://unlock-protocol.com/guides/how-to-add-an-event-to-a-luma-calendar/ i am setting a unlock protocol workshop with the with Mkt & Comms Lead @UnlockProtocol Ceci Sakura | Tu Voto Decide | Unlock Protocol lets also /clipboard step by steps to make an unlock and then luma for the event"
tier: QUICK
---

# 896 - Unlock Events + Luma calendar setup (ZABAL Gamez x Unlock workshop)

> **Goal:** Stand up the ZABAL Gamez workshop with Ceci Sakura (Unlock Protocol) as an onchain Unlock ticket, then surface it on the ZAO Luma calendar - the exact two-layer flow, from Unlock's own guides.

## Key Decisions

| Decision | Call | Why |
|----------|------|-----|
| Ticketing layer | USE EVENTS by Unlock Labs (events.unlock-protocol.com) | Deploys a "lock" (ticket smart contract) in ~2 minutes; auto-generates a landing page with registration link. The native fit for an Unlock-co-hosted session. |
| Network | USE Base | The ZAO's chain across ZABAL Gamez (Empire Builder, POIDH bounties all on Base 8453). Keep the ticket on the same chain. |
| Price | Free (price 0) + the "I'm Going" commitment / attendee screening toggle | It is a free workshop. For a free high-demand event, attendee screening restricts tickets to organizer-approved wallets. |
| Discovery layer | LIST on luma.com/zao via "Submit Event" -> "Add Event from External Platform" | Luma is the ZAO's RSVP/discovery surface; it points at the Unlock registration link. Unlock = the onchain ticket, Luma = the front door. |
| Calendar approval | Zaal self-approves | The ZAO calendar (luma.com/zao, cal-jPH4al7AMlXzdNN) is ZAO-admined, so the "pending approval by the calendar admin" step is a self-approve. |

## Findings

### Part 1 - Create the Unlock event (events.unlock-protocol.com, ~2 min)

1. Gather details first: event name, ticket quantity (capacity), price/currency (or free), transferability preference, ticket artwork file.
2. Go to events.unlock-protocol.com, connect the ZAO event wallet, and deploy a "lock" (the ticket smart contract). Unlock states this "can be set up in about two minutes."
3. The system auto-generates a landing page with "event details, location, timing, and a registration link." **This landing-page URL is the input for Luma.**
4. Optional - free, high-demand: toggle attendee screening (a.k.a. the "I'm Going!" commitment feature, designed for free events) so only organizer-approved attendees get a ticket.
5. Distribute/comp tickets: event page -> Attendees -> Airdrop -> send by email or wallet address (use to comp Ceci + the ZAO team).
6. Own-site checkout (optional): Unlock's Checkout Builder generates a URL to sell/register on zabalgamez.com, and configures metadata collection (name, email).
7. Day-of check-in: attendees show a QR code scanned by any phone camera, or a designated "verifier" uses the EVENTS app.

### Part 2 - Add it to the ZAO Luma calendar

1. Open the target calendar - here, luma.com/zao.
2. Right-hand sidebar: click **Submit Event** (above the month-and-day calendar).
3. A panel opens on the right; select **Add Event from External Platform**.
4. Provide the Unlock event landing-page URL (from Part 1).
5. Enter event name, location, host, and time; verify the time zone (EST for ZAO).
6. Click **Submit** -> shows "pending approval by the calendar admin."
7. Once approved, the event appears on the official calendar (luma.com/zao).

### Two-layer model (why both)

Unlock owns the onchain ticket / proof-of-attendance (NFT, gating, airdrops, verifiable check-in). Luma owns discovery + RSVP on the ZAO calendar. The Luma listing is an "external platform" pointer at the Unlock registration link - they are complementary, not redundant.

### Integration point in the ZABAL Gamez codebase

ZABAL Gamez stores each workshop's Luma link in `data/workshop-leads.json` as the `luma_url` field (one entry per session), rendered on the homepage schedule and the `/recordings` pages. After publishing the Luma, add a workshop-leads entry for Ceci's session with `luma_url` set to the new lu.ma link so it shows in the schedule. The ZAO calendar id is `cal-jPH4al7AMlXzdNN` (per zabalgamez CLAUDE.md).

## Also See

- (none yet - first Unlock-events doc in the library)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Deploy the Unlock event (free, Base) for "ZABAL Gamez x Unlock Protocol - Workshop with Ceci Sakura" | @Zaal | Task | Before the session date |
| Submit + self-approve it on luma.com/zao via Add Event from External Platform | @Zaal | Task | Same day |
| Comp tickets to Ceci + ZAO team via Attendees -> Airdrop | @Zaal | Task | After deploy |
| Add the session to `data/workshop-leads.json` (`luma_url`) in zabalgamez so it hits the schedule | @Zaal | PR | After Luma is live |

## Sources

- [How to Add an Event to a Luma Calendar - Unlock Protocol](https://unlock-protocol.com/guides/how-to-add-an-event-to-a-luma-calendar/) [FULL - full step list read]
- [How to Sell NFT Tickets for an Event - Unlock Protocol](https://unlock-protocol.com/guides/how-to-sell-nft-tickets-for-an-event/) [FULL - full step list read]
- [Unlock Guides index](https://unlock-protocol.com/guides/) [FULL - surfaced the "I'm Going" commitment feature, email config, tokenproof guides]
- [EVENTS by Unlock Labs app](https://events.unlock-protocol.com) [PARTIAL - landing page is a JS app behind wallet-connect; create flow confirmed via the guides above, not the live app]
- [ZAO Luma calendar](https://luma.com/zao) [FULL - confirmed live, ZAO-admined]

_Tier QUICK: a vendor-procedural how-to, where Unlock's own guides are the authoritative source. No community/Reddit/HN source was sought - it would not change the documented steps._
