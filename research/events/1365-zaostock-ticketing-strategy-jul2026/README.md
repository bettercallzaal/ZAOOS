---
topic: events/zaostock
type: DECISION-BRIEF
status: URGENT — decisions needed by Jul 21, 2026
created: 2026-07-17
related-docs: 1326, 1329, 1333, 1336, 1349, 1357, 1361
owner: Zaal (makes all 4 decisions, gated — executes after approval)
---

# 1365 — ZAOstock Ticketing Strategy (Jul 2026)

> **Deadline: July 21, 2026.** Four sub-decisions must be locked by Jul 21 per the Q3 calendar (doc 1353). The earlier tickets launch, the more runway for audience math to work out (doc 1329: need 200+ tickets at $15 = $3K revenue). This doc provides the recommendation + rationale for each decision so Zaal can decide in one sitting.
>
> **Recommendation summary:**
> - Platform: Eventbrite (fastest to launch, widest audience, fee is worth it)
> - Pricing: $15 general admission, $5 add-on donation (charity), $10 virtual ticket
> - Launch: Instagram Stories July 21 + X/Farcaster same day
> - At-door: Yes, $20 walk-up (price premium incentivizes advance purchase)

---

## Decision 1: Ticketing Platform

### Options

| Platform | Setup time | Fee per ticket | Pros | Cons |
|----------|-----------|----------------|------|------|
| **Eventbrite** | 30 min | 3.7% + $1.79 per ticket | Most widely known, automatic discovery, email list capture, mobile check-in app, instant payouts | Fee cuts into revenue |
| **Luma** | 20 min | 0% for free / 2% for paid | Free option available, cleaner UX, popular in web3 circles | Less general-audience discovery |
| **Unlock Protocol** | 1+ hour, requires wallet | Gas fees (~$0.50-$2) | On-chain, aligns with ZAO brand, NFT tickets | Non-crypto attendees need wallet — friction, not suitable for Year 1 |
| **Direct link (Stripe)** | 2+ hours (dev) | 2.9% + $0.30 | Full control, no platform lock-in | No event discovery, requires dev work |
| **Door only (no advance)** | 0 | 0% | Zero setup | No revenue planning, no email list, no sell-out buzz |

### Recommendation: **Eventbrite**

Reasons:
1. Fastest to launch (can be live in 30 min today)
2. Automatic discovery — Eventbrite surfaces events to users searching for things to do in Ellsworth/Maine
3. Mobile check-in app for volunteers (no paper tickets needed)
4. Email list capture — every ticket buyer's email goes into a Zaal-controlled export list
5. Fee is worth it: on 200 tickets at $15, Eventbrite fee = ~$440. Unlock/Stripe saves ~$200 but requires dev time and adds friction.

**Alternative:** Luma if Zaal wants a zero-fee option and expects most ticket buyers to come from ZAO channels (not general discovery). Luma also integrates better with Farcaster audience.

---

## Decision 2: Pricing

### Recommendations

| Ticket type | Price | Rationale |
|------------|-------|-----------|
| **General admission (advance)** | **$15** | Low barrier, mainstream Maine audience, matches area festival precedent |
| **At-door (day-of)** | **$20** | $5 premium incentivizes advance purchase and smooths day-of check-in flow |
| **Charity add-on (optional)** | **$5** | "Add $5 to support [Maine charity]" — increases charitable take without raising base price |
| **Virtual ticket / livestream** | **$10** | Access to the Restream link (doc 1346); value-anchored against in-person |
| **Artist + team comps** | **$0** | 8 artists + ~5 team comps = 13 free tickets out of ~200 |
| **VIP (if any)** | **$35-$50** | Optional — if there's a backstage / meet-the-artists angle. Not required in Year 1. |

**Revenue math:**
- 150 advance at $15 = $2,250
- 60 at-door at $20 = $1,200
- 50 charity add-ons at $5 = $250
- 100 virtual at $10 = $1,000
- **Total: ~$4,700** (conservative) if all targets hit

Note: doc 1333 budget assumes $3,000 from tickets. The above model exceeds that if virtual attendance performs.

### On free vs. paid:

Do NOT make ZAOstock free. Reasons:
1. Free events correlate with higher no-show rates (30-50% of registrations don't show)
2. $15 signals real event value and filters for committed attendees
3. Artists are getting paid — ticket revenue is the direct funding mechanism
4. Fisher grant application is strengthened by ticket revenue as a funding line

---

## Decision 3: Launch Date + Platform Sequence

### Recommendation: **July 21, 2026**

**Why July 21 specifically:**
- COC #8 announcement goes out July 21 (doc 1317) — bundle ZAOstock ticket news into same social push
- 74 days before ZAOstock = enough runway for organic spread
- After ticketing is live, artist reveal campaign (doc 1313) begins with "tickets on sale now" CTA in every post

**Launch sequence:**

| Platform | When | Content |
|----------|------|---------|
| **Instagram @zaostockme** | Jul 21, 12pm EST | Stories + post with ticket link (Eventbrite URL) |
| **X @wavewarz** | Jul 21, 12pm EST | Tweet: "ZAOstock tickets are LIVE — Oct 3, Ellsworth ME. $15 advance. All 8 artists selected by community vote. [Link]" |
| **Farcaster /zao** | Jul 21, 12pm EST | Same CTA adapted for Farcaster framing |
| **Paragraph newsletter** | Jul 21, 6pm EST | Short "tickets live" email to subscriber list |
| **Telegram** | Jul 21, 1pm EST | ZOE posts battle announcement + "ZAOstock tickets live" |

### Instagram @zaostockme launch post (copy-ready)

> **Caption:**
> ZAOstock tickets are LIVE 🎵
>
> Oct 3, Ellsworth ME | 8 artists | all ages | outdoor
>
> Every artist on the lineup earned their spot through community vote — no label connections, no industry gatekeepers.
>
> $15 advance | $20 at door | $10 virtual livestream
>
> Link in bio → zaostock.com
>
> 📍 Franklin Street Parklet, Ellsworth, Maine
>
> #ZAOstock #MaineMusic #EllsworthMaine #IndependentMusic #LiveMusic

---

## Decision 4: Eventbrite Event Setup (Step-by-Step)

If Eventbrite is chosen, here's the exact setup:

### Go to: eventbrite.com → Create event

**Event name:** `ZAOstock — Oct 3, 2026 | Ellsworth, Maine`

**Description (paste-ready):**
> ZAOstock is a one-day community music festival in Ellsworth, Maine featuring 8 independent musicians — every artist on the lineup earned their spot through a community vote, not industry connections.
>
> October 3, 2026 | Franklin Street Parklet, Ellsworth, ME | All ages | Outdoor
>
> **Ticket types:**
> - General Admission: $15 (advance) / $20 at door
> - Virtual Ticket (livestream access): $10
> - Optional charity donation (+$5): proceeds benefit [charity name]
>
> Artist lineup announced progressively starting August 2026.
>
> Questions? Email zaalp99@gmail.com

**Ticket types to create:**

1. General Admission — $15 — max 200 tickets
2. At-Door (select at event) — $20 — max 75 tickets
3. Virtual Livestream — $10 — max 500 tickets
4. Charity Add-On — $5 — max 500 (unlimited, add-on not standalone)
5. Comp (Artist/Team) — $0 — max 20, password protected

**Event settings:**
- Venue: Franklin Street Parklet, Ellsworth, ME 04605
- Date: October 3, 2026, [time range TBD from doc 1336]
- Organizer name: The ZAO
- Organizer website: thezao.xyz
- Event category: Music → Festival

**After creating:** Export the ticket URL and add to:
- Instagram bio link
- zaostock.com buy button
- Doc 1336 (day-of runbook) — ticket check-in section
- Fisher grant application "revenue model" section

---

## Gated Decision Checklist (complete by Jul 21)

- [ ] **Decision 1:** Choose platform (Eventbrite recommended)
- [ ] **Decision 2:** Confirm pricing ($15 advance / $20 door / $10 virtual confirmed or adjusted)
- [ ] **Decision 3:** Confirm launch date (July 21 recommended)
- [ ] **Decision 4:** Create Eventbrite event (30 min)
- [ ] Add ticket URL to Instagram @zaostockme bio
- [ ] Add ticket URL to zaostock.com (ask Iman or update directly)
- [ ] Post launch content across X, Farcaster, Instagram, newsletter (use templates above)
- [ ] Add Eventbrite ticket revenue projections to Fisher grant application (doc 1349)

---

*Created: 2026-07-17 | URGENT: Jul 21 deadline | Recommendation: Eventbrite at $15GA / $20door / $10virtual | Related: 1326 (ZAOstock ticketing prior doc), 1329 (marketing plan — "tickets live" triggers all content), 1333 (budget model — ticket revenue), 1336 (day-of runbook — check-in), 1349 (Fisher grant — ticket revenue evidence), 1357 (charity — $5 add-on), 1361 (sponsors — mention alongside ticket announcement)*
