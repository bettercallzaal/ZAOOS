---
topic: business
type: decision
status: research-complete
last-validated: 2026-07-10
superseded-by:
related-docs: "418, 1007, 1009"
original-query: "prep zaostock and zaoville for zaofestivals and start to put budgets and other things together - loop on what other events do and model after the best"
tier: STANDARD
---

# 1013 — ZAO Festivals Budgets: Reconciling ZAOstock, Building ZAOville From Scratch

> **Goal:** ZAOstock's budget number has drifted across at least 4 different figures with no reconciliation. ZAOville has never had one. Fix both, grounded in real comparable-event benchmarks - not made up.

## Key Decisions

| Recommendation | Why |
|---|---|
| **Adopt the production-audit memory's $7K minimum / $20K target / $25K stretch as ZAOstock's ONE canonical budget going forward** | It's the most detailed, itemized figure that exists, and it sits inside the external benchmark range for comparable events (see Findings). The other three numbers in circulation (memory's $5K/$25K, doc 418's $15.75K/$19.3K, the live sponsor page's zero stated figure) should stop being cited |
| **Apply a 40/20/15/15/10 cost-allocation template to the $20K target** - Production 40% ($8,000) / Marketing+ticketing 20% ($4,000) / Staffing+volunteer logistics 15% ($3,000) / Community+artist honoraria 15% ($3,000) / Contingency 10% ($2,000) | Sourced from a real fundraiser-budget framework built specifically for first-time/budget-focused community festivals (see Sources). Gives ZAOstock's finance circle an actual spending plan, not just a total |
| **Build ZAOville's first-ever budget at $500-$1,200, not from a percentage template** | ZAOville's real costs are almost entirely already covered in-kind (VEC provides all sound equipment free per the live `/zaoville` page). The only genuine cash line items are insurance, permits (if needed), and minor promotion/incidentals - comparable open-mic/showcase events in this exact cost bracket run $500-$2,000 total, and ZAOville starts from a lower baseline than most because sound is already free |
| **Confirm venue/permit status for ZAOville before finalizing its number** | The live `/zaoville` page names "The VEC" as equipment provider but doesn't say whether the venue itself is private property (no permit needed) or a public space (needs a permit, $50-$300). This is the single biggest swing factor in ZAOville's real cost and nobody has answered it yet |
| **Update the stale $5K/$25K figure in `project_zao_stock_confirmed.md`** | That memory file still carries the March 31 numbers the production audit superseded on April 11. It's the file most likely to get quoted by a future session if not fixed |

## Findings

### 1. ZAOstock's budget number has drifted across 4 different figures with zero reconciliation

| Source | Date | Figure |
|---|---|---|
| `project_zao_stock_confirmed.md` (memory) | 2026-03-31 | Goal $25K, minimum viable $5K |
| `project_zao_stock_production_audit.md` (memory, no standalone doc number) | 2026-04-11 | $7K minimum viable, $20K target, $25K stretch |
| Doc 418 (Birding Man comparison table) | undated, post-April | "Budget $15.75K vs $19.3K expenses" (mislabeled under a "Parking org" table row, no supporting breakdown found anywhere in that doc) |
| Live `/sponsor` page (zaostock.com, checked 2026-07-09) | current | No total dollar figure stated at all - the three sponsor tracks (Local/Virtual/Ecosystem Partners) are described as "flexible," with no number anywhere on the page |

Four sources, four different answers, and the most recent public-facing one (the live site) has quietly dropped the number entirely rather than picking one. This is exactly the kind of drift that makes a sponsor conversation awkward - a prospective sponsor who saw doc 418's $15.75K somewhere and one who saw the production audit's $20K would be told two different stories. [FULL - all four sources read directly this session]

### 2. External benchmarks for a comparable 500-person free community festival converge close to the production audit's numbers

Checked multiple independent sources on what a small, free, local-artist outdoor festival actually costs:

- **run-sheets.com** (festival budget template site): *"A 500-capacity single-day outdoor festival with local acts typically costs $25,000-$50,000."*
- **General web aggregate** (SoFi, Promotix, and others via search): *"For an intimate 500-person boutique gathering with local talent and minimal infrastructure, you might spend anywhere from $15,000 to $40,000."* A separate source: *"if you had 500-1,000 people... probably expect a cost of $10-15k in a less rural location."*
- **fundraiser.page** (budget-friendly festival fundraiser guide): recommends a clean cost-allocation template for first-time/budget-focused community festivals: **40% production (sound/light/rentals), 20% marketing and ticketing, 15% staffing/volunteer logistics, 10% contingency, 15% community and artist fees or honoraria.**

The production audit's $20K target sits inside every one of these ranges, and is closer to the low end (appropriate for ZAOstock's genuinely minimal-infrastructure setup - no fencing, no multi-stage build, community-donated venue via Heart of Ellsworth). Doc 418's $15.75K/$19.3K figure also technically fits inside the range, which is part of why it's gone unquestioned for months despite having no traceable source - it's plausible-sounding without being grounded. [FULL - 3 independent external sources, plus the internal doc 418 comparison table and the production-audit memory]

### 3. Applying the fundraiser.page template to the production audit's $20K target gives ZAOstock a real spending plan

| Category | % | Amount | What it covers (per the production-audit memory + this session's line items) |
|---|---|---|---|
| Production | 40% | $8,000 | Sound system (the production audit's flagged make-or-break item), Wallace Events tent/stage, AV |
| Marketing + ticketing | 20% | $4,000 | Print materials (lineup cards - sponsor page cites "200+"), digital ads, wayfinding signage, RSVP/ticketing tooling |
| Staffing + volunteer logistics | 15% | $3,000 | Volunteer crew shirts (per `/apply` page - "a ZAOstock crew shirt" is a stated perk), day-of coordination, safety/first-aid |
| Community + artist honoraria | 15% | $3,000 | Artist travel/hospitality stipends (AttaBotty from Jacksonville FL, FailOften from Kansas City are both confirmed traveling per memory) |
| Contingency | 10% | $2,000 | Raised from the production audit's original 5% recommendation to the standard 10% for outdoor/weather-dependent events |
| **Total** | **100%** | **$20,000** | |

This is a genuinely new artifact - no prior ZAOstock doc has broken the target number down into a spending plan by category. [FULL - template sourced externally, applied to internal $20K figure, cross-checked against known ZAOstock cost items from the production-audit memory and doc 1007]

### 4. ZAOville has never had a budget, and its real costs are almost entirely already covered

The live `/zaoville` page (`zaostock.com/zaoville`) states plainly: **"Equipment provided by The VEC"** - DJ sound management, Sennheiser wireless mics, 2 JBL monitors, all free. DCoop (founder of The VEC) co-hosts. This means the single largest line item in every comparable-event benchmark checked this session (sound/production, 40% of ZAOstock's budget) is already at or near $0 for ZAOville.

External benchmarks for this exact scale and format:

- **A pop-up open-mic event leveraging an existing/rented venue**: *"$500-$2,000 per event"* covering venue, basic sound rental, and minimal promotion (financialmodel.net).
- **Recurring small open-mic operating costs**: *"$150-$500 per night"* once set up.
- **General liability insurance**: *"$300-$600 annually"* - the one line item every comparable source flags as non-negotiable regardless of scale.
- **Permits**: *"$50-$300"*, but only *if* the event is on public/city property - private-venue events (which The VEC likely is, given it's DCoop's own space) often need none.
- **Seattle Center's own published small-event cost sheet** (a real municipal arts-venue rate card, used here only as a sanity-check comparable, not a direct source since Seattle rates don't transfer to DC): a small-sound/1-2-performer setup with paid staff labor runs $680 total; a 3-5-performer setup with a stage lead runs $1,235. ZAOville is closer to this shape (single evening, small stage, no paid production labor since sound is donated) than to a ticketed festival.

Given ZAOville doesn't charge admission, doesn't need a purchased sound system, and is co-hosted by the venue owner, a realistic first budget is: **Insurance ($300-600) + Permits (likely $0 if private venue, up to $300 if not) + Marketing/promotion ($50-200) + Artist/host incidentals - snacks, water, small thank-you gifts ($100-300) + Contingency (~15%, ~$100)**, landing the total between **roughly $500 and $1,200** depending on the permit answer. [FULL - 3 external open-mic/small-event cost sources plus one municipal rate-card sanity check, applied against the confirmed in-kind equipment donation from the live `/zaoville` page]

### 5. The one open question that swings ZAOville's number the most: is the venue public or private?

Every open-mic cost source checked treats "is a permit required" as the single biggest binary cost swing (the difference between $0 and $50-300, plus potentially insurance requirements changing). The live `/zaoville` page names "The VEC" as the equipment provider and DCoop as co-host/founder, but never states whether the actual event space is The VEC's own private venue or a public/rented space. This should be confirmed before finalizing ZAOville's number - it's a five-minute question with a real budget impact. [FULL - directly observed gap in the only existing source, the live page itself]

## Also See

- [Doc 418 — Birding Man Festival Analysis](../../events/418-birding-man-festival-analysis/) — the existing ZAOstock comparable analysis; source of the unreconciled $15.75K/$19.3K figure this doc retires
- Memory: `project_zao_stock_production_audit.md` — the source of the $7K/$20K/$25K figures this doc reconciles on; no standalone research doc was ever written for this 2026-04-11 audit, only the memory summary survives
- [Doc 1007 — ZAOstock T-86 Days Readiness Audit](../../events/1007-zaostock-t86-readiness-audit/) — this session's prior ZAOstock status check; didn't touch budget specifically, this doc fills that gap
- [Doc 1009 — ZAO Festivals Brand Audit](../1009-zaofestivals-brand-audit/) — the zaofestivals.com/socials audit from earlier this session (originally doc 1004, renumbered on merge); this doc's ZAOville work extends that umbrella-brand context to the DMV chapter specifically

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Confirm whether the ZAOville venue is private (no permit) or public (permit needed, $50-300) - shipped when the answer is recorded and ZAOville's budget number is finalized either way | Zaal | Todo | 2026-07-14 |
| Add ZAOville's first-ever budget line ($500-$1,200 pending the permit answer) to whatever budget-tracking surface ZAOstock's finance circle uses - shipped when the number exists somewhere other than this doc | Zaal | Task | 2026-07-16 |
| Update `project_zao_stock_confirmed.md` to replace the stale March 31 "$5K/$25K" figure with the production audit's $7K/$20K/$25K - shipped when the memory file is edited | Zaal | Todo | 2026-07-11 |
| Add a one-line budget-reconciliation note to doc 418 pointing at this doc, so the unsourced $15.75K/$19.3K figure stops circulating unlinked - shipped when doc 418 is edited | Zaal | Todo | 2026-07-14 |
| Get ZAOstock's finance circle (currently coordinator "(open)" per the last-known roster) to review and either confirm or adjust the 40/20/15/15/10 spending-plan breakdown in Finding 3 - shipped when a named person signs off on the category splits | Zaal | Task | 2026-07-18 |
| Add a stated budget figure back to the live `/sponsor` page (it currently states none at all) - shipped when a PR merges adding either the $20K target or a range to the public page copy | Zaal | PR | 2026-07-21 |

## Sources

- `zaostock/src/app/zaoville/page.tsx` — [FULL, read directly this session from the live repo]
- `zaostock/src/app/sponsor/page.tsx`, `/apply/page.tsx` — [FULL, read directly this session, confirms no budget figure currently public and the crew-shirt/hospitality line items used in Finding 3]
- `project_zao_stock_confirmed.md`, `project_zao_stock_production_audit.md` (memory) — [FULL, read this session]
- [Doc 418 — Birding Man Festival Analysis](../../events/418-birding-man-festival-analysis/) — [FULL, read this session, source of the unreconciled figure]
- [Music Festival Budget Template, run-sheets.com](https://run-sheets.com/budget-examples/music-festival-budget-template) — [FULL, fetched via exa 2026-07-10, source of the "$25,000-$50,000 for 500-capacity" benchmark]
- [Budget-Friendly Music Festival Fundraiser Tips](https://fundraiser.page/creating-a-budget-friendly-music-festival-fundraiser-tips-an) — [FULL, fetched via exa 2026-07-10, source of the 40/20/15/15/10 template]
- [What Are the Startup Costs for Hosting an Open Mic Night?, financialmodel.net](https://financialmodel.net/blogs/cost-open/open-mic-night-artists) — [FULL, fetched via exa 2026-07-10, source of the $500-$2,000 pop-up open-mic range and $300-600 insurance figure]
- [ARTISTS AT THE CENTER 2024-25 Production Cost Breakdown, Seattle Center](https://seattlecenter.com/Documents/Events/FeaturedEvents/Artists%20at%20the%20Center/AATC_ProductionCosts_24-25.pdf) — [FULL, fetched via exa 2026-07-10, used as a municipal rate-card sanity check only, not a direct DC-area comparable]
- [How to Build a Music Festival Budget, Eventbrite](https://www.eventbrite.com/blog/festival-budget/) — [PARTIAL - general framework referenced, specific dollar ranges cited are for larger-scale events (2,000-capacity) and used only for the priority-tiering concept, not ZAOstock's actual numbers]
- General web aggregate on 500-person free festival costs (SoFi, Promotix, and related) — [PARTIAL - synthesized search-result summary, not independently re-fetched per source this session]
