# 1636 — ZAOstock 2026: Eventbrite Listing Spec

**Type:** OPERATIONS-SPEC  
**Topic:** Events  
**Status:** ACTIVE — Listing goes live Jul 21 (tomorrow). This doc gives Zaal the exact copy to paste into Eventbrite: event title, description, ticket tiers, tags, and settings. After publishing, share the link with ZOE for newsletter/social use.

---

## Eventbrite Event Details

### Event Title
```
ZAOstock 2026 — Music Battles. On-Chain. Live.
```

### Event Subtitle (if available)
```
WaveWarZ MAIN Battle + Charity Battle + On-Chain Payouts — Ellsworth, Maine
```

### Date and Time
- **Date:** Saturday, October 3, 2026
- **Start time:** 12:00 PM ET (doors open)
- **End time:** 7:00 PM ET (estimated)

### Location
- **Venue name:** [Venue name — Zaal fills]
- **Address:** [Venue address], Ellsworth, ME 04605

### Category
- Primary: Music → Live Music
- Secondary: Community → Nonprofit & Activism (supports grant framing)

### Tags
```
wavewarz, music battle, on-chain, DAO, WaveWarZ, Maine music, Ellsworth, blockchain music, crypto music, ZAO, live music, festival
```

---

## Event Description (paste into Eventbrite)

```
ZAOstock 2026 — the first WaveWarZ live-audience event.

On October 3, 2026, WaveWarZ comes to Ellsworth, Maine in person for the first time. WaveWarZ is a music battle prediction market where two artists go head-to-head, fans trade on who wins, and even the losing artist receives a guaranteed on-chain payout — automatically, no middleman.

1,245 WaveWarZ battles have been completed since launch. ZAOstock brings the first live audience into the room.

---

WHAT HAPPENS AT ZAOSTOCK:

Supporting Sets
Live performances from ZAO-affiliated artists.

Charity Battle (2:30 PM)
Two artists compete in a charity battle. 100% of all trading volume goes directly on-chain to a Maine arts nonprofit — automatic, verifiable, no middleman. Charity chosen by ZOR token holders through on-chain governance.

WaveWarZ MAIN Battle (3:00 PM)
The headline event. Two artists battle live. The audience votes in real time — in person and remote via wavewarz.info. ZOR token holders' votes count on-chain. The losing artist still earns an on-chain payout when the battle closes.

---

ZAO is the music DAO that built WaveWarZ — 100+ consecutive weeks of on-chain governance, 1,245 battles completed, and now: live.

This is a small event. Capacity is limited.

Questions? [contact email or @WaveWarZ on X]

---

wavewarz.info | @WaveWarZ | Farcaster: /wavewarz
```

---

## Ticket Tiers

### Tier 1: General Admission
- **Name:** General Admission
- **Price:** $25
- **Quantity:** [max capacity − VIP quantity − artist/volunteer holds]
- **Description:** Entry to ZAOstock 2026. Includes all performances, charity battle, and WaveWarZ MAIN battle.
- **Sales end:** Oct 2, 2026 11:59 PM ET (or when sold out)

### Tier 2: ZOR Holder / ZAO Community
- **Name:** ZAO Community Ticket (ZOR Holder or ZABAL Alumni)
- **Price:** $15
- **Quantity:** 20 (limit 1 per person)
- **Description:** Discounted ticket for ZOR token holders and ZABAL alumni. Please bring wallet proof at door (Phantom wallet with ZOR token visible, or Zaal's approval DM).
- **Sales end:** Sep 25, 2026

### Tier 3: VIP (Optional — Zaal decides)
- **Name:** VIP — includes meet Zaal + early entry
- **Price:** $75
- **Quantity:** 10 max
- **Description:** Early entry at 11:30 AM, meet the team, front-row position for MAIN battle. Very limited.
- **Sales end:** Sep 15, 2026 (or when sold out)

### Tier 4: Artist / Performer (Free — Internal)
- **Name:** Artist Comp
- **Price:** $0
- **Quantity:** 10
- **Visibility:** Hidden (send link directly to artists)

---

## Eventbrite Settings Checklist

- [ ] **Publish status:** Draft until Zaal review → Publish Jul 21 morning
- [ ] **Ticket sales page:** Make it public immediately on publish
- [ ] **Refund policy:** No refunds after Sep 15 (confirm with Zaal)
- [ ] **Contact email:** zaalp99@gmail.com (or ZAOstock-specific email if set up)
- [ ] **Eventbrite fee absorption:** Check if fees are absorbed (higher net) or passed to buyer (lower price shown)
- [ ] **Donation option:** Consider adding a $5-10 voluntary charity add-on at checkout — 100% to ZAOstock charity battle recipient
- [ ] **Header image:** ZAOstock 2026 branded graphic (doc 1627 visual identity — ZAO Black + ZAO Gold gradient)
- [ ] **Organizer name:** ZAO (ZTalent Artist Organization)
- [ ] **Organizer website:** wavewarz.info

---

## After Publishing: Share with ZOE

Once the Eventbrite listing is live, send Zaal the URL and forward to ZOE via Telegram:
```
"ZAOstock Eventbrite is live: [URL]. Use this in Newsletter Issue 1 (doc 1617), X thread, Farcaster /wavewarz cast, and Telegram announcement."
```

ZOE holds this URL in memory and inserts it in all Jul 21 announcement posts.

---

## Fiscal Sponsor Note (If Fractured Atlas Approved)

If Fractured Atlas approves the ZAO membership before Oct 3 (expected Aug-Sep):
- Update Eventbrite organizer description to include: "ZAO operates under fiscal sponsorship with Fractured Atlas (501c3 EIN 45-4904875). Donations are tax-deductible."
- Add donation tier to Eventbrite at that point
- FA EIN appears on all receipts for grant documentation

---

## ZAOstock Eventbrite → Supabase Flow

When attendees RSVP:
- Eventbrite fires webhook to Hurricane-built endpoint (doc 1630: `POST /api/webhooks/eventbrite-attendee`)
- Hurricane inserts row into `zaostock_2026_attendees` (doc 1625 schema)
- ZOE sends welcome sequence starting with T-14 day email (doc 1585)

**Hurricane build target:** Eventbrite webhook wired by Aug 15.

---

## Related Docs

- 1617 — ZAO Newsletter Issue 1 (Eventbrite URL goes in Section 1)
- 1602 — ZAOstock Insurance + Permit Tracker (venue + permit context for Eventbrite description)
- 1585 — ZAOstock Attendee Pre-Event Welcome Pack (ZOE welcome sequence after RSVP)
- 1627 — ZAO Visual Identity Spec (header image guidelines)
- 1618 — Fractured Atlas Application Spec (fiscal sponsor note added after FA approval)
- 1625 — ZAO Supabase Schema Reference (`zaostock_2026_attendees` table)
