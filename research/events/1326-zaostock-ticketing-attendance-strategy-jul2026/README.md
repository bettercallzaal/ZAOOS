# 1326 — ZAOstock Ticketing + Attendance Strategy (July 2026)

> DECISION NEEDED: Artist reveals start August 4. Ticket/RSVP links must exist BEFORE the first reveal post or the campaign lands nowhere. This doc covers ticketing platform options, pricing strategy, on-chain ticketing angle, capacity planning, and the launch sequence. Cross-refs: [doc 1313](./1313-zaostock-artist-announcement-strategy-jul2026/) (reveal calendar), [doc 1267](./1267-zaostock-local-search-setup-copy/) (Eventbrite copy), [doc 1285](./1285-zaostock-permit-call-script-jul2026/) (capacity via permit), [doc 1228](./1228-zaoville-jul25-day-of-runbook/) (day-of runbook), [doc 1277](./1277-zaostock-artizen-bank-pitch-pack-jul2026/) (sponsor context).

**Critical constraint:** ZAOstock artist reveal Week 1 = August 4. Ticket link must be in the reveal post. This means ticketing must be live by **July 31 at the latest**.

**Capacity note:** Pending permit call July 20. Whatever capacity the permit allows defines the maximum ticket count. Build ticketing around permit outcome.

---

## Section 1: Pricing Decision

**Three pricing models — Zaal picks:**

### Option A: Free + RSVP
- No ticket revenue
- Maximum attendance, but risk of no-shows
- RSVP link (Google Form or Eventbrite free) = easy to implement
- Good for: year one where community building > revenue
- Revenue model: sponsorships + bar/merch revenue

### Option B: Tiered Paid
- General Admission: $15-25
- VIP (early entry, artist meet-and-greet, premium spot): $40-75
- ZAO Member / WaveWarZ bettor discount: 20-30% off
- On-chain discount: show SOL wallet with WW activity = discount code
- Revenue model: ticket sales + sponsorships + bar/merch
- Estimate at 300 attendees × $20 avg: $6,000 ticket revenue
- Estimate at 500 attendees × $20 avg: $10,000 ticket revenue

### Option C: Hybrid (Free/RSVP base + Paid Premium)
- Free general admission with RSVP (capacity limited)
- Paid VIP tier ($40-75) = premium experience, guaranteed entry
- Sell 50-100 VIP tickets at $50 avg = $2,500-5,000
- Risk: complexity of managing two ticket types at door

**ZAO North Star angle:** On-chain ticketing (Option B + Zora ticket NFTs or similar) creates citable "ZAO sold ZAOstock tickets on-chain" milestone. But adds friction.

**Recommendation:** Option B (paid) — $20 GA + $50 VIP — with ZAO community discount. Keeps implementation simple, generates revenue toward artist fees, creates real economic data for the ZAO case study.

---

## Section 2: Platform Options

### Option 1: Eventbrite (Recommended for GA)
- Pros: highest discovery, Google integration, doc 1267 already has Eventbrite copy
- Cons: 3.5% + $1.59/ticket fee (on a $20 ticket = ~$1.20 per ticket fee)
- Revenue: $18.80/ticket after fees
- Implementation: 30 minutes
- SEO/local search: Eventbrite listings show in Google searches for "Maine music festival"
- **Already set up in doc 1267** — just need to activate + set price

### Option 2: Luma (Modern alternative)
- Pros: cleaner UX, better for community events, lower fees, free tier available
- Cons: less discovery than Eventbrite
- Fees: 2.5% + $0.99 on paid events (better than Eventbrite)
- Revenue: $18.51/ticket after fees
- Implementation: 20 minutes

### Option 3: Zora / On-chain ticket NFTs (ZAO North Star option)
- Pros: creates on-chain ZAOstock attendance record, citable, aligns with DAO ethos
- Cons: requires crypto wallet (friction for non-crypto Maine attendees), complex refund logic
- Platform: Zora or directly on Solana using token-gated entry
- Implementation: 4-8 hours
- **Use ONLY if there's dev time — do NOT make this the primary ticketing if it delays launch**

### Option 4: Hybrid (Recommended)
- **Primary**: Eventbrite OR Luma for GA tickets (simple, discoverable)
- **Secondary**: Zora NFT for VIP / "ZAO member" tier (optional add-on for crypto community)
- The ZAO community buys the Zora NFT; general Maine audience buys Eventbrite

---

## Section 3: Capacity Planning

**This depends on permit call July 20. Fill in after that call:**

| Scenario | Max capacity | Target sell | Notes |
|---------|------------|-----------|-------|
| Venue A (large outdoor) | TBD from permit | 80% of max | |
| Venue B (small indoor) | TBD from permit | 90% of max | |
| Confirmed from permit call | [FILL IN JULY 20] | | |

**Working assumptions until permit confirmed:**
- Conservative: 200 attendees
- Target: 350-500 attendees
- Maximum: Whatever permit allows

**Artist wristbands:** Reserve 2 per artist + 2 per crew = ~30 wristbands set aside from capacity

---

## Section 4: Ticket Launch Sequence

**Must-do before August 4 (artist reveal Week 1):**

| Date | Action | Owner |
|------|--------|-------|
| Jul 20 | Permit call: confirm venue + capacity | Zaal |
| Jul 21 | Decide: Option A, B, or C above | Zaal |
| Jul 22-23 | Create Eventbrite listing (use doc 1267 copy) | Iman or Zaal |
| Jul 24-25 | Create Luma listing as backup | Iman or Zaal |
| Jul 28 | ZAO community soft launch: share ticket link in Discord/newsletter | Zaal |
| Jul 31 | **Ticket link live and tested — HARD DEADLINE** | |
| Aug 4 | Week 1 reveal: "get your tickets now" CTA in post | All reveals |

**Soft launch copy (for July 28 community announcement):**
```
ZAOstock is October 3. Tickets are [now available / RSVP open].

This is our first annual festival — a full day of music, community, and onchain culture in [Maine].

Artist reveals start August 4. Be there: [TICKET LINK]

[General admission: $20 | VIP: $50 | ZAO member discount: use code THEZAO]
```

---

## Section 5: Day-Of Door Management

**At the door:**
- 1 person managing Eventbrite check-in (phone app)
- 1 person for wristbands
- Cash/Venmo available for walk-ups (if capacity allows)
- Artist wristbands: different color from GA, pre-distributed at load-in

**Day-of ticket sales:**
- If not sold out: sell at the door for $25 GA (higher than presale = incentivizes presale)
- If sold out: add to waitlist, turn away walk-ups at capacity

---

## Section 6: Revenue Projection

| Scenario | GA (200 at $20) | VIP (50 at $50) | Total ticket rev |
|---------|--------------|--------------|----------------|
| Conservative (250 attendees) | $4,000 | $2,500 | $6,500 |
| Target (400 attendees) | $7,000 | $3,500 | $10,500 |
| Optimistic (500 attendees) | $9,000 | $4,000 | $13,000 |

After artist fees ($2,000-3,000 for 8 acts), sound ($500-1,500), venue deposit, production costs, target break-even or small surplus.

**The real economic story for ZAO case study:**
ZAOstock doesn't need to be hugely profitable in year one — it needs to:
1. Actually happen (the milestone)
2. Generate enough revenue to pay artists directly on-chain (or via SOL)
3. Produce the documentation for grants and press

---

## Section 7: On-Chain Ticketing Narrative (for future)

**What to build toward (2027 ZAOstock):**
- Tickets as Zora NFTs on Base
- Attendance record stored permanently on-chain
- ZAO member + WaveWarZ bettor = discounted NFT tier
- Post-show: attendees receive commemorative NFT

**What this creates:** "ZAOstock sold tickets as NFTs — attendees own a piece of the event on-chain, forever." Press angle, citable metric, ZAO IP narrative.

**For 2026:** Skip the complexity. Use Eventbrite. Document the intent for 2027.

---

## Decisions Needed (GATED for Zaal)

| Decision | Options | Deadline |
|---------|---------|---------|
| Free/RSVP vs. Paid tickets | Option A (free), B (paid $20/$50), C (hybrid) | Jul 21 |
| Primary ticketing platform | Eventbrite vs. Luma | Jul 22 |
| Ticket launch date | Jul 28 (soft) vs. Aug 1 (hard launch) | Jul 21 |
| On-chain VIP tier (Zora NFT) | Yes (4-8 hrs dev) vs. No (simpler) | Jul 22 |

---

*Created: 2026-07-17 | ZAO OS doc 1326 | Events subfolder | DECISION NEEDED: ticketing platform + pricing before Aug 4 reveals*
