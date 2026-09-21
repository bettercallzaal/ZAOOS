---
topic: business
type: market-research
status: research-complete
last-validated: 2026-09-21
related-docs: 473, 919, 2097
original-query: "How reasonable/feasible is it to make 3 ZAO trading cards for 3 ZAO artists - cost, production options (physical vs digital), precedent elsewhere in the ZAO ecosystem or comparable music/community projects, IP/rights considerations for using an artist's likeness/art, and a rough recommendation on whether to pursue it."
tier: STANDARD
---

# 2529 - ZAO Artist Trading Cards: Feasibility

> **Goal:** Is making 3 trading cards for 3 ZAO artists a reasonable thing to do, and if so, how (physical, digital, cost, timing)?

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Do it** | YES, it is reasonable - cheap, low-risk, and ZAO has already done it before (ZAO-CHELLA 2024). Not a new capability, a repeat of a proven one. |
| **Which artist selection** | Not decided here - open decision for Zaal. This doc models cost/logistics generically against ZAOstock's real 8-act roster as an example, not a recommendation of which 3. |
| **Physical vs digital** | Digital first, physical only if time allows. A designed card image (PNG/PDF) costs nothing but design time and can ship this week. Physical adds real per-unit cost and, more importantly, a print lead time this project may not have room for 12 days out from ZAOstock. |
| **If physical: vendor** | UPrinting.com - real product, real fetched pricing (see Sources), quantities from 25 cards up, turnaround as fast as 1 business day for a rush fee. Confirmed a fit; Printful does NOT offer trading cards (checked, ruled out). |
| **Consent** | Each artist must explicitly approve their own card before anything ships or prints - not covered by their general roster/lineup approval. This mirrors how this project already handles artist photos: photo_url changes go through the artist's own backstage claim-token link, never a blanket team decision (`src/app/api/backstage/[code]/route.ts` in ZAODEVZ/ZAOstock, verified in the same session that spawned this research). |

## Findings

### Real ZAO precedent exists - and it worked

ZAO-CHELLA (Miami, Wynwood, Art Basel week, December 6 2024) - one of the two 2024 IRL "ZAO Festivals" events, the direct lineage ZAOstock 2026 continues - already produced real collectible trading cards for its performing artists. Confirmed across three independent internal records (`research/_archive/231-community-profiles-tyler-candy-swarthy-dcoop`, `research/community/229-zao-member-profiles`, `research/events/919-zao-palooza-zao-chella-event-record`, `docs/superpowers/plans/2026-04-01-zao-festivals-pages.md`): "10 Web3 musicians, AR art, trading cards," organized by AttaBotty + DaNici. This is real, done-before precedent, not a novel idea - the answer to "is this reasonable" starts at "yes, ZAO has already shipped this once." **Gap:** none of those four records capture a per-unit cost, vendor, or print quantity for the 2024 run - that detail either lives on Zaal's own archive or was never logged. Worth asking him directly if a real comparison point matters.

### A second, related ZAO precedent is dead - do not revive it

`research/events/473-road-to-zaostock-magnetic-portal` (April 2026, Tyler Stambaugh's proposal) planned a full "each artist has a unique collectible that hides an unreleased song snippet" mechanic as part of a 14-week pre-event drip campaign, built on Tyler's Magnetic platform (magnetiq.xyz). **This entire vendor relationship is retired.** Per this account's own house rules (`~/.claude/CLAUDE.md`, "Retired - do not reference," Zaal 2026-07-31: "no longer working with magnetiq please do not reference it again"), Magnetiq must not be cited as a live option or partner for anything going forward, including this. The doc itself is also stale on its own terms: it assumed a 10-artist roster and a June-15-start weekly drip that ZAOstock 2026's real timeline (8 confirmed acts, Oct 3 event, this research written 12 days out) never followed. Noted here only so nobody re-proposes "use Magnetic for the artist collectibles" without knowing it was already tried and is now off the table for an unrelated reason.

### Cost - physical, real vendor pricing fetched live (2026-09-21)

**UPrinting.com** (uprinting.com/trading-cards.html) - a real, currently operating, direct trading-card print product, fetched raw (not WebSearch-summarized):

- Quantity options: 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 1,000 up to 10,000
- At 250 cards (the page's default shown quantity): **$31.01 total, $0.12 per card**, standard 6-business-day turnaround
- Rush turnaround available down to 1 business day (for a fee not itemized on this page - would need to configure the actual order to get the rush price)
- Card stock options: 14pt and 16pt, gloss/matte/soft-touch/UV finishes
- For 3 artists x even a modest 50 cards each (150 cards total) - in the same per-unit range, likely close to or under $0.15/card given the pricing curve, so roughly **$20-30 total** for a 150-card run. This is an estimate interpolated from the fetched 250-qty price point, not a separately fetched 150-qty number - re-quote the real 150-count price before committing.

**Make Playing Cards (makeplayingcards.com)** - also real and fetched live, but its "Custom Trading Card Printing" product is priced **per deck** (a full multi-card set), not per single card design repeated N times: $10.25/deck at 1-5 decks down to ~$4-5/deck at 100-249 decks, depending on deck size/stock selected. This is the wrong shape of product for "3 individual cards, printed in quantity" - it's built for a full card-game deck, not a small trading-card run. Noted for completeness since it's a real, no-minimum vendor with no setup charge, but UPrinting is the better fit for this specific ask.

**Printful** - checked directly (fetched its product catalog pages): does **not** offer trading cards or playing cards as a product line, only postcards and apparel. Ruled out, not a fit.

**DriveThruCards** - a real, well-known vendor in the indie card-game community, named as a comparison point worth checking, but its site returned HTTP 403 (bot-blocked) on a direct fetch and could not be independently verified this session. A WebSearch summary (not independently fetched, treat as PARTIAL/unverified) suggested a higher $0.60-$1.00/card range for small batches with premium finish options - plausible given it targets professional card-game publishers, but not confirmed against a real page. If DriveThruCards specifically matters, escalate via a browser session rather than trust this number.

### Cost - digital

Near-zero marginal cost: a designed card image (PNG at social/print resolution, or a simple PDF) costs only design time, no print vendor, no shipping, no minimum order, no lead time. Shareable immediately on socials, in the newsletter, or as a Discord/Telegram drop. This is the only option that can realistically ship before ZAOstock 2026 if design + artist approval both take real time.

### Production recommendation

Digital-first: design 3 card images now (or whenever artists are picked and approve), release digitally this cycle. Hold physical printing as a fast-follow, not a blocker - UPrinting's own turnaround (1-6 business days depending on rush fee) means physical cards CAN still be ready before Oct 3 even if design doesn't start until early next week, but only if artist approval doesn't stall the timeline. Digital removes that risk entirely for a first pass.

### IP / consent

Each artist's likeness, photo, and any original art used on their card is theirs, not the festival's, to publish without explicit sign-off on that specific use - a general "yes, put me on the lineup" is not the same as "yes, print/post my photo on a collectible card." This project's own backstage system already encodes this distinction in code: artist photo changes go through a per-artist `claim_token`-gated link (`/artist/<slug>?token=...`), never a blanket team edit - confirmed directly in the ZAODEVZ/ZAOstock repo this same session (`src/app/api/backstage/[code]/route.ts`, `src/lib/artists.ts`'s `verifyClaimToken`). Trading cards should follow the same discipline: send each selected artist a preview of their specific card and get their explicit yes before printing or posting, not before the general roster announcement.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Pick which 3 artists (of the 8 confirmed ZAOstock acts) get cards | @Zaal | Decision | 2026-09-24 |
| Design 3 card images (digital-first) once artists are picked | @Zaal or design lane | Asset | 2026-09-27 |
| Send each picked artist their specific card design for explicit approval before any print/post | @Zaal | Outreach | Same day as design is ready |
| If pursuing physical: get a real UPrinting quote at the actual chosen quantity (not the interpolated 150-card estimate above) | @Zaal | Vendor quote | 2026-09-28 |
| If a real cost comparison to ZAO-CHELLA 2024's cards matters, ask Zaal directly for the vendor/cost - not recorded anywhere in the research library | @Zaal | Reply | wontfix unless asked |

## Sources

- [research/events/919-zao-palooza-zao-chella-event-record](../../events/919-zao-palooza-zao-chella-event-record/) - ZAO-CHELLA trading card precedent [FULL - internal doc, read directly]
- [research/_archive/231-community-profiles-tyler-candy-swarthy-dcoop](../../_archive/231-community-profiles-tyler-candy-swarthy-dcoop/) - "ZAO-CHELLA: Event materials, AR art display coordination, trading cards" [FULL]
- [research/community/229-zao-member-profiles](../../community/229-zao-member-profiles/) - AttaBotty + DaNici produced ZAO-CHELLA with collectable trading cards [FULL]
- [research/events/473-road-to-zaostock-magnetic-portal](../../events/473-road-to-zaostock-magnetic-portal/) - the retired Magnetiq-based collectible concept, ruled out [FULL - internal doc, read directly]
- [UPrinting trading card pricing](https://www.uprinting.com/trading-cards.html) - $31.01 / $0.12 per card at 250 qty, fetched raw 2026-09-21 [FULL - method: curl + HTML strip, real price extracted from page text]
- [Make Playing Cards custom trading card printing](https://www.makeplayingcards.com/design/custom-trading-card-printing.html) - deck-priced, $10.25-$139/deck depending on qty/stock, fetched raw 2026-09-21 [FULL - method: curl + HTML strip]
- [Printful custom products catalog](https://www.printful.com/custom-products) - confirmed no trading/playing card product, fetched raw 2026-09-21 [FULL - method: curl + HTML strip, negative result]
- [DriveThruCards](https://www.drivethrucards.com/browse/pub/1/DriveThruCards) - named comparison vendor [FAILED - HTTP 403 bot-block on direct fetch, not independently verified; a WebSearch-synthesized $0.60-$1.00/card range exists but is unescalated, treat as PARTIAL at best]
- `src/app/api/backstage/[code]/route.ts`, `src/lib/artists.ts` (ZAODEVZ/ZAOstock, main branch as of 2026-09-21) - the existing per-artist consent pattern this doc recommends reusing [FULL - read directly in the same session]
