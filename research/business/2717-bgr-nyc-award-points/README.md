---
topic: business
type: decision
status: research-complete
last-validated: 2026-10-24
superseded-by:
related-docs: ""
original-query: "my goal with bpionts is to get enough thtat whenver i want from bangor to newyork i can get a flight with points" (Zaal, 2026-10-24, relayed by the messenger with five sub-questions: airlines BGR-NYC, award prices, which programs his points reach, fastest card path, crediting Turkish and SWISS flights to United)
tier: QUICK
---

# 2717 - Bangor to New York on points: United to Newark as the anchor

> **Goal:** Find the one points program that gets Zaal from Bangor (BGR) to New York on an award ticket whenever he wants, and the fastest way to fill it.

Point balances are private and are not in this doc. They are kept with Zaal's own notes, with the round-trip count worked out there.

## Key Decisions

| # | Recommendation | Why |
|---|---|---|
| 1 | **USE United MileagePlus as the one program, flying BGR-EWR.** | Bangor airport's own page (fetched 2026-10-24) lists United with "daily service to Newark Liberty (EWR)". Delta is the only other year-round nonstop to NYC. American's LaGuardia service is seasonal. United is also the one program that his Chase Ultimate Rewards, his JetBlue points (through Blue Sky) and his Star Alliance flights can all reach. |
| 2 | **USE JetBlue TrueBlue points on the same United flights now.** JetBlue itself does not fly from Bangor. | The BGR airlines page names Allegiant, American, Breeze, Delta and United, and not JetBlue (confirms Zaal's belief). JetBlue's own page says TrueBlue points redeem "to destinations on 6 continents" through the United collaboration. AwardFares (updated 2026-07-14) says members "can now book United-operated flights through the Blue Sky partnership, subject to the award space United releases". |
| 3 | **USE Alaska (Atmos) points only for American's seasonal BGR-LGA.** | By AwardWallet's reading of the Atmos partner chart (2026-07-31), partner flights in the Americas under 700 miles cost 4,500 points one way. BGR-LGA is 378 miles. BGR is not in AwardWallet's list of 922 routes found at that price, probably because the route is seasonal, so the 4,500 price on this route is UNVERIFIED until an actual search shows it. |
| 4 | **WATCH Delta through Virgin Atlantic; do not plan on it yet.** | Delta flies BGR to LGA and JFK daily, so it has the most seats. Chase points can reach Delta through Virgin Atlantic Flying Club. The only Virgin price I fetched is from Dec 2023: 7,500 points one way for Delta nonstops of 0-500 miles (Thrifty Traveler). That is too old to plan on. Re-price it in a live Virgin search before moving any points. |
| 5 | **The fastest single card is Chase Sapphire Preferred: 75,000 points after $5,000 spent in 3 months, $95 annual fee.** Research only, no application. | Read from chase.com on 2026-10-24. Its points move 1:1 to JetBlue (AwardFares). They also move to United, but the ratio was not fetched. The bonus "may not be available to you if you previously held this card". Whether he can get it is UNVERIFIED. |
| 6 | **Credit both the Turkish and SWISS flights to United MileagePlus.** | Both are Star Alliance, so the miles land in the same program he would use for BGR-EWR. How many miles each fare class earns on United is UNVERIFIED: united.com refused curl, exa and Playwright. Read the booking class off each ticket, then use United's partner-earning page in a normal browser. |

## Comparison

All distances are great-circle, worked out from each airport's coordinates on Wikipedia: BGR-LGA 378 mi, BGR-JFK 382 mi, BGR-EWR 393 mi.

| Program | Flight it books from BGR | Year-round? | One-way economy price | Price source |
|---|---|---|---|---|
| United MileagePlus | United BGR-EWR nonstop | Yes, daily | Dynamic, no published chart. UNVERIFIED | none fetched. Secondary sites disagree (12,500 vs 15,000 vs a 5,000-12,500 floor), so none of them is used here |
| JetBlue TrueBlue (Blue Sky) | United BGR-EWR | Yes, daily | Priced separately from JetBlue's own awards. UNVERIFIED for this route | AwardFares 2026-07-14 (no BGR example) |
| Alaska / Atmos | American BGR-LGA nonstop | No, seasonal | 4,500 points under 700 mi (chart rule) | AwardWallet 2026-07-31 |
| Virgin Atlantic Flying Club | Delta BGR-LGA or BGR-JFK nonstop | Yes, daily | 7,500 points for 0-500 mi, as of Dec 2023 | Thrifty Traveler 2023-12-05, dated |

## How many trips the current balances cover

The count only holds where a price is verified, and only the Alaska price comes close. At 4,500 points each way (9,000 per round trip) on American's seasonal LGA flight, the Alaska balance covers the whole number of round trips noted privately. The United and JetBlue round-trip counts stay UNKNOWN until one live BGR-EWR award price is read. That one search is the first Next Action.

## Next Actions

| # | Action | Owner | Done when |
|---|---|---|---|
| 1 | Search one BGR-EWR economy award on united.com and on jetblue.com (points toggle) for the same date. Write both prices down. | Zaal (logged-in search) | Two dated prices recorded with his notes |
| 2 | Search one BGR-LGA award on alaskaair.com in American's season | Zaal | The 4,500 price confirmed or corrected |
| 3 | At booking, add the United MileagePlus number to the Turkish and SWISS tickets and read the booking class | Zaal | Both tickets show the MileagePlus number |
| 4 | Decide on the Sapphire Preferred application. It is his call (gated: a credit application). | Zaal | yes or no |
| 5 | Re-price Delta through Virgin Atlantic before moving any Chase points there | research lane, on request | A live 2026 price, or this row dropped |

## Sources

| URL | Method | Status |
|---|---|---|
| https://www.flybangor.com/airlines | curl + HTML strip, 2026-10-24 | [FULL] airline list and route wording quoted from raw text |
| https://en.wikipedia.org/wiki/Bangor_International_Airport, .../LaGuardia_Airport, .../John_F._Kennedy_International_Airport, .../Newark_Liberty_International_Airport | curl + strip | [FULL] for coordinates only. Distances computed with the haversine formula |
| https://www.jetblue.com/jetblue-united | curl + strip | [FULL] Blue Sky redemption wording. No prices on the page |
| https://www.jetblue.com/destinations | curl | [FAILED - HTTP 406]. BGR absence taken from the airport's own page instead |
| https://awardfares.com/blog/trueblue-guide/ | curl + strip | [FULL] United redemption wording, transfer ratios. [PARTIAL - no BGR or short-haul United price; its examples are long-haul] |
| https://awardwallet.com/airlines/alaska-atmos-rewards/low-cost-awards/ | curl + strip | [FULL] the 4,500 under-700-mi rule and the route list (BGR not in it) |
| https://thriftytraveler.com/news/virgin-atlantic-delta-award-chart-hike | curl + strip | [FULL] distance table. [PARTIAL - dated 2023-12-05] |
| https://www.nerdwallet.com/article/travel/the-good-the-bad-and-the-very-bad-of-the-new-virgin-atlantic-delta-award-chart | curl + strip | [PARTIAL - page shell only, the article body with the chart was not in the raw HTML] |
| https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred | curl + strip | [FULL] 75,000 / $5,000 / 3 months / $95 |
| https://www.united.com/en/us/fly/mileageplus/earn/airline-partners/turkish-airlines.html and .../swiss.html | curl, WebFetch, exa, Playwright | [FAILED - connection refused or timed out on all four; Wayback returned 429]. Escalated as Next Action 3 |
| https://www.alaskaair.com/content/mileage-plan/use-miles/award-charts | curl | [FAILED - 308-byte shell] |
| https://www.virginatlantic.com/en-US/flying-club/spend-points/partner-award-chart | curl | [FAILED - 404] |
| https://www.aircanada.com/ca/en/aco/home/aeroplan/redeem/partner-redemption-chart.html | curl | [FAILED - 404]. Aeroplan pricing on United was not used |

Codebase search: this is personal travel research, and no ZAO code path applies. The PRs, the vault and the research library were searched before this doc (by the messenger, 2026-10-24) and found nothing on award points.
