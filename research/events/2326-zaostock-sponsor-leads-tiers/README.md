---
topic: events
type: leads-tiering
status: draft-for-zaal
last-validated: 2026-08-20
board-task: b80026fc
related-docs: "2325, 2310, 2279, 2295, 1079, 1334, 1361, 1539, 1562, 1659, 1031, 610"
original-query: "Sponsor leads doc: cold/warm/hot tiers + discount authority - pairs with the pitch deck (doc 2325); outreach starts once the deck exists"
tier: STANDARD
---

# 2326 - ZAOstock Sponsor Leads: cold / warm / hot tiers + discount authority

> **Goal:** One list of every sponsor, partner and in-kind lead ZAOstock has, tiered the
> way Zaal defined on the 8/17 standup, plus the pre-authorized discount rules so a
> teammate can close a conversation without coming back to him. Card b80026fc (P1, due
> 2026-08-21). Pairs with doc 2325 (the deck). **Nothing here is sent until Zaal says the
> deck exists (his 8/19 gate).**

## Zaal's definitions (verbatim, 8/17 transcript)

> "I'm going to create a document that has just potential sponsors - cold, warm, hot
> leads. Hot is we've already had a conversation and they're interested. Warm is we have
> some kind of connection. Cold is we're just going to be random DMing."

> "My goal here is that I want to get the resources to our team. So when they're asked
> questions, they don't have to be like, oh, I have to go back to my team to answer that.
> They have the full authority to give the, like, oh, we can give you a 25% discount if
> you X, Y, Z, right? Date."

## System of record

The live sponsor CRM is the `sponsors` table in the ZAO STOCK Supabase project
(yjrlaxpjusmrfylumban; schema doc 610; 39 rows as of doc 1079 with a
`confirmed-past-sponsor` tag). This doc is the tiering + authority layer on top of it.
**Gap:** that project's keys are not on this Mac (grep of `~/.zao/zao.env` and
`.env.local` by key name, 2026-08-20), so the rows below come from docs, cards and call
transcripts, not from the table. First job when the keys are reachable: reconcile this
list against the table and tag each row hot/warm/cold there.

## HOT - conversation had, they are interested

| Lead | What | Status / source | Owner |
|---|---|---|---|
| Black Moon Public House (Steve Peer + Katina) | Venue next door, official after-party 6-8 PM, beer garden under their permit, ~25 x $25 gift cards for musicians + staff, bar-revenue % above a threshold they name, sound + PA offer | CONFIRMED partner 8/16; details doc 2310 + 2295. Open: their threshold number, headcount from us (card 7aa6bb7a) | Zaal |
| Star 97.7 (Paul) | Radio partner, on-air day pending a day Zaal can take off | "On board, good to go" (Zaal, doc 2279); card 236edf76 | Zaal |
| Wallace Events (via Roddy) | Tents + logos (two logo files arrived 8/17) | Partner; cards 5eb3f8fa, fbcf1d46 | Zaal / design |
| Heart of Ellsworth (Chesnee Barney, Cara Romano) | Host; venue landlord; Maine Craft Weekend umbrella; community calendar; Yodel; bank-partner intros | Partner. Logo use NOT yet approved internally (2279 action 2) - keep HoE logo off surfaces until Chesnee says yes | Zaal |
| Web3Metal (Shawn) | First official partner, time donation | `sponsors` table, track=partner (memory project_zao_stock_team) | Shawn |
| Steve Peer's sound + PA offer | "Sound and PA provided on each stage" | Said on the 8/17 call; needs verifying in person (card d7ecbc39) - treat as hot-but-unverified | Zaal |

## WARM - some kind of connection

| Lead | Connection | Ask | Who closes |
|---|---|---|---|
| Arbor Camp (Rachel Stone, Leslie) | Chesnee is packaging lodging with them for a November HoE event; her action #10 was to get Rachel's number | Official Artist House (in-kind lodging) - pitch drafted, `~/zao-vault/people/Arbor-Camp.md`, card 9e2ad6a8 | Zaal via Chesnee |
| Two local food spots (unnamed) | Zaal 8/17: "two people that I have as warm potential food options" for the five-gift-card-brands idea | $25 gift cards for artist/staff meals (Katina's model) | Zaal - NAME THEM (decision 3) |
| Momo's (Nadine runs comms) | Chesnee: "they would welcome the plug" | In-kind food or community partner | Zaal (2279 action 7) |
| Fogtown Brewing (John Stein) | Chesnee intro; Fogtoberfest is the SAME weekend | Beverage / cross-promo; Thursday slot possible | Zaal (2279 action 8) |
| Eric Marisha | Met in person re merch; re-emailed | Merch partner | Zaal (2279 action 9) |
| Franklin Savings Bank (Ellsworth branch) | HoE Downtown Grants partner bank; new branch in town; OneNote notes name them as a concert-series sponsor idea | Presenting-tier cash - via HoE warm intro | Zaal |
| Bangor Federal Credit Union | HoE bank partner AND a named Art of Ellsworth sponsor (doc 1079) | Presenting / Platform tier | Zaal |
| Machias Savings Bank | HoE bank partner; confirmed multi-event sponsor (Bucksport Bay) (doc 1079) | Presenting / Platform tier | Zaal |
| First National Bank (Ellsworth) | HoE bank partner | Artist / Community tier | Zaal |
| Sealander Architects | Already sponsors Art of Ellsworth directly (doc 1079) | Platform tier | Zaal |
| Ellsworth American | Art of Ellsworth sponsor; local paper | Media trade: coverage + listing for logo | Zaal (2279 action 14 adjacent) |
| Keith Berry / Cushlings | Dcoop's contact; they grant directly to artists | Sponsor-an-artist ($500) | Dcoop |
| Humanoids + music-centred brands | Dcoop's network, "all intertwined" | Sponsor-an-artist, online tier | Dcoop |
| Bar Harbor cluster: Sam Shawn, Brian (Ivory Manor), Dale Stockburger, Airline Brewery, Lisa (Elizabeths) | Already in CRM (OneNote sweep 8/18) | Community tier / in-kind / lodging referrals | Zaal |
| Brandon Staylard (Music Harbor, Oct 18-19) | Knows the Maine music scene; festival two weeks after ours | Cross-promo, not cash | Zaal |
| Coinflow, Juke, Empire Builder (Adrian), Neynar / Farcaster | Named "confirmed partners" in doc 1562 (Jul 2026). UNVERIFIED for Aug - no card found; Magnetiq from that list is RETIRED | Online-tier activations (doc 1562 specs) | Zaal - CONFIRM (decision 4) |
| Optimism Foundation, Fractal (Sam Williams), Gitcoin | Existing ZAO governance / grant relationships (doc 1334) | Online tier | Zaal |
| Audius | 34 ZAOstock-adjacent artists on Audius (doc 1334, Jul) | Artist tier / co-promo | Zaal |
| Renewal by Andersen | Sponsored HoE's tote giveaway (OneNote archive) - precedent, no contact yet | Community tier | Zaal |
| Spectrum Reach | Running the Art of Ellsworth regional video + digital campaign (2279) | Get ZAOstock into the campaign, not cash | Zaal via Chesnee |

## COLD - random DMing, door to door

Local, in 1079's "confirmed past sponsor of a comparable event" order (hottest cold first):
Bangor Savings Bank; Brown Holmes & Milliken Agency (ALSO the first insurance-broker call,
doc 1045 - one visit, two asks); Front Street Shipyard; Dead River Company; Darling's
Chevrolet; Two Rivers Realty; John R. Crooker Insurance; Seaboard FCU; The Bud Connection;
Eden Street Flowers; Uncle Buggy's Hotel for Dogs; Versant Power; Jordan's Restaurant; The
Roost Barracks; Chase's Daily (Blue Hill); Bar Harbor Inn; Downeast Friends of Folk;
Penobscot Bay Press; Ellsworth Public Library + town newsletters (listings, not cash).

Regional / national (doc 1361, 1334): Hannaford; L.L. Bean; MaineHealth; DistroKid;
Splice; Base.

People, not brands: three colleges' AV students (mass cold DM with Dcoop, card 901324ef);
Nextdoor (installed 8/17) for AV help + local promo.

## In-kind is its own track (doc 1079 finding 3)

Pitch these for things, not cash - florists, bakeries, restaurants, printers say yes to
goods and no to cheques:

| Need | Best-fit leads | Tier it maps to |
|---|---|---|
| Artist + staff meals (5 brands x gift cards) | the two warm food spots, Momo's, Jordan's, Chase's Daily | Community |
| Lodging | Arbor Camp; Bar Harbor Inn; Ivory Manor | Platform (Artist House) |
| Tents / staging | Wallace Events (in) | Partner |
| Printing (program, poster, banners) | a local print shop - none identified yet | Community |
| Beverage | Black Moon (in); Fogtown; Airline Brewery | Community / Artist |
| Transport | Bendigo / BIM Transportation ("man with a van or two", OneNote) | Community |
| AV gear | college AV programs; Dcoop's reusable-gear purchase (ZAO Festivals repays Jan/Feb) | - |

## Discount authority (proposal - Zaal taps before anyone uses it)

Zaal's intent is "full authority to give a 25% discount if you X, Y, Z, date." The rules
below are the minimum that makes that real. The 25% is his number; the conditions are the
proposal.

| Rule | Proposed | Why |
|---|---|---|
| Early close | 25% off any cash tier for a signed yes by a DATE Zaal sets (decision 1) | Turns "I'll think about it" into a deadline |
| In-kind at face value | Goods/services count at their retail value toward a tier; no extra discount on top | Keeps Arbor Camp / food / print pitches one sentence long |
| Sponsor-an-artist is flat | $500, no discount, artist must opt in | It is a cost, not a margin |
| Mutuals floor | A $50-100 "Friend of the Fest" line for people we know, name on site + newsletter, no negotiation | Zaal: "a $50 sponsorship we can make worth it" |
| Bundle | A sponsor who also takes an artist's gift-card meals or a room gets the next tier's stage mention | Rewards the local partners doing two things |
| Escalate | Anything over the Presenting tier, any multi-year ask, any exclusivity ("only bank"), any on-chain or token ask -> Zaal | The gated class |

Who holds the authority once Zaal taps: Zaal (banks, HoE, door-to-door), Dcoop (Keith
Berry, humanoids, music brands, college AV), Paper + Candy (design-side partners), Steve +
Katina (local intros they offer). Everyone else routes to Zaal.

## Binding rules for every send

- No sends until the deck exists (Zaal's gate). Then Zaal or a named holder above, never a
  loop or a bot.
- No "tax-deductible" - the 501(c)(3) fiscal partner is OUT (card 6386c0c7). Until a
  replacement is live, sponsorships are plain payments.
- No $20K / $25K figures. No raffle language.
- Log every touch in the `sponsors` table (system of record), not in chat.

## Decisions for Zaal (five taps)

1. **Early-close date** for the 25% rule.
2. **Approve or edit the six authority rules** above.
3. **Name the two warm food spots** so someone other than you can follow up.
4. **Confirm the Web3 partner statuses** (Coinflow / Juke / Empire Builder / Neynar) -
   doc 1562 called them confirmed in July; nothing since.
5. **Who gets authority** - the list above, or narrower.

## Follow-through

| Who | Owes | To whom | By |
|---|---|---|---|
| Zaal | 5 decisions above | this doc + the holders | 2026-08-21 (card due) |
| Zaal | "deck exists" call that opens outreach | the holders | when 2325 decisions land |
| Chesnee | Rachel's number (Arbor Camp); HoE logo yes/no; Yodel listing after the Facebook event | Zaal | open since 8/13 |
| Zaal | Facebook event (unblocks Chesnee's calendar listing) | Chesnee | card cc314651 |
| Dcoop | first touches on Keith Berry / humanoids once authorized | Zaal | after decision 5 |
| zaostock lane | reconcile this list into the `sponsors` table when keys are reachable | board | next session with keys |

## Sources

- Doc 2310 transcript lines 224-270, 300-312 - FULL, internal (verbatim definitions + authority intent)
- Doc 2279 README actions 1-15 + "Local intel" - FULL, internal
- Docs 1079, 1334, 1361, 1539, 1562, 1659, 1031, 610 - FULL, internal
- Cowork board `tasks`, project ZAOSTOCK, sponsor/partner title search 2026-08-20 - FULL (7 live cards)
- OneNote archive `~/zao-vault/onenote/local-impact/{zao-stock,promotion,ellsworth-m}.md` sponsor lines - FULL
- Memory: project_zao_stock_team (Web3Metal), project_zao_stock_confirmed, the 8/18 handoff (Bar Harbor cluster, Bendigo)
- ZAO STOCK Supabase `sponsors` table - NOT READ (no keys on this Mac)
