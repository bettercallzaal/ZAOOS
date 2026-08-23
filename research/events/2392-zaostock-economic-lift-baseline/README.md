---
topic: events
type: decision
status: research-complete
last-validated: 2026-08-23
superseded-by:
related-docs: "2295, 2310, 1032, 2325"
original-query: "iterate on how we can make zaostock a success"
tier: STANDARD
---

# 2392 - The one ZAOstock measurement whose window closes before the event

> **Goal:** Zaal asked how to make ZAOstock a success. The highest-leverage
> answer is not another task on the 18 already open. It is that the outcome he
> named out loud as the point of the whole day is not being measured, and the
> chance to measure it expires on 3 October.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Capture a pre-event revenue baseline from Franklin St businesses before 3 October.** | Zaal's own stated goal is proving economic lift. Lift is a delta. A delta needs a before. **After the event, the before is unrecoverable.** |
| 2 | **Ask Black Moon first, and ask this week.** | Katina already tracks daily sales, is already a partner, is already issuing gift cards, and is already in the room. One question to one collaborator gets the anchor number. |
| 3 | **Three businesses is enough. Do not build a survey programme.** | The claim "we added $X to a local Saturday" needs a credible sample, not a census. Three is defensible and achievable in 42 days; twelve is neither. |
| 4 | **This is a SPONSOR asset, not a nice-to-have.** | Doc 2325's pitch deck and doc 2326's sponsor tiers both need a reason a brand should pay. "We measurably moved money into this town" is that reason, and it is the only one that compounds into year two. |
| 5 | **DO NOT invent or estimate any number.** | A fabricated lift figure aimed at sponsors and a city is materially worse than no figure. If a business will not share, record that they declined - never model it. |

## The goal, in his own words

From the 2026-08-15 call with Steve Peer, transcript read verbatim
(doc 2295, `transcript.md`):

> "the goal is throughout that whole day is to try and support **showing what an
> event like that would do to the local businesses** so that'd be really good for
> me to be able to **show that data** of like okay we brought this is **the
> average amount that is in per month** and like or **on a day to day basis**
> right and then like **this is the amount additional we added to that in a day**"

That is not a vague aspiration. It is a specific measurement design, stated
unprompted: average daily/monthly revenue, versus event-day revenue, difference
attributed to the event.

## The finding

**112 ZAOstock research directories exist. None of them measures this.**

Searched `research/` for baseline / economic impact / business lift / foot
traffic across every ZAOstock doc. The only hit for "foot traffic" is in doc
1032's evacuation procedure - directing people to exits, not counting them.

So the estate has planned this festival in extraordinary detail - operations,
accessibility, permits, EMS coverage, grants, sponsor tiers, a pitch deck, a
day-of ops plan - and has not planned to measure the outcome that the founder
described as the point.

## Why this is the highest-leverage item, and not just another task

**Because its window closes first, and closes silently.**

Every other open item fails loudly. If the PA does not arrive, everyone knows on
3 October at noon. If the poster is late, someone notices. **If the baseline is
never captured, nothing happens at all** - the event runs, everyone has a good
day, and then in November someone asks "so what did it do for the town?" and the
honest answer is permanently "we don't know."

That is the ORPHANED-EVIDENCE version of the false-green pattern this estate has
spent the week on: no alarm fires, because the thing that failed was a
measurement nobody was watching for.

**And the asymmetry is severe.** Cost to capture: one message to Katina, plus
two more asks. Cost of missing it: the difference between *a festival happened*
and *a festival is proven to move money into Ellsworth*. The second is a sponsor
deck, a city-council argument, a case study, and the basis for doing it again.
The first is a nice day.

## The measurement, designed to be cheap

Deliberately minimal. This should take one conversation per business.

### What to ask for

| Field | Why | Ask |
|---|---|---|
| Average daily revenue, a normal week | the denominator | "roughly, on a normal Saturday" |
| Average **Saturday** revenue | 3 Oct is a Saturday; comparing to a Tuesday inflates the lift | same conversation |
| Event-day revenue, 3 Oct | the numerator | collect the following week |
| Rough headcount or covers | separates "more people" from "same people spending more" | optional, only if easy |

Ranges are fine. **"About $800 on a normal Saturday" is a usable baseline.**
Exact books are not needed and asking for them will cost goodwill.

### Who, in order

1. **Black Moon Public House** - Katina. Already a partner, already the second
   stage, already issuing performer gift cards. She is the anchor and the
   easiest ask. Steve is the warm intro and is on the call weekly.
2. **One food business on Franklin St** - the food-truck or catering thread
   already in flight (card 9394, Katina's gift-card mechanism).
3. **One retail or cafe neighbour** - via the Ellsworth Chamber of Commerce,
   which Zaal is already a member of and already planned to visit for catering.

### The honest framing to use

Not "share your books with us." It is:

> "We're trying to prove that events like this actually move money into
> Ellsworth, so we can bring more of them here and make the case to the city.
> Would you be willing to tell us roughly what a normal Saturday looks like, and
> then what 3 October looked like? Ranges are fine, and we'd publish it as a
> combined number, not per-business, unless you want the credit."

Combined-by-default protects them and still produces the headline figure.

### What comes out

One sentence, and it is the most valuable sentence ZAOstock can produce:

> "On 3 October, three Franklin Street businesses took a combined $X against a
> normal-Saturday baseline of $Y - a Z% lift, on a day that cost the city
> nothing."

## What this does NOT need

- No POS integration, no app, no dashboard. A number in a notebook is fine.
- No survey platform, no forms, no per-transaction tracking.
- Not every business on the street. Three, credibly.
- No new tooling from this estate. **This is a conversation, not a build.**

## Honest limits

- **Attribution is imperfect and should be stated as such.** Weather, a
  competing event, or a normal seasonal swing all affect the number. Report it
  as observed lift on the day, not as proven causation.
- **Three businesses is a small sample.** That is a deliberate trade of rigour
  for achievability, and it should be disclosed rather than hidden.
- **No business has been asked yet.** This doc proposes; nothing is agreed. All
  three asks are Zaal's - they are relationships, not tasks.
- Whether Katina tracks daily figures in a form she can share is **unverified**.
  The assumption that she does comes from her running the venue and issuing
  gift cards, not from her saying so.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Ask Katina for a normal-Saturday revenue range for Black Moon. Done when a number or a decline is recorded in the vault | @Zaal | Ask | 2026-08-29 |
| Ask two more Franklin St businesses, one food, one retail/cafe, via the Chamber visit already planned | @Zaal | Ask | 2026-09-12 |
| Add the baseline figures to the sponsor deck (doc 2325) and tiers (doc 2326) as the value argument | @Zaal (Claude) | Edit | 2026-09-19 |
| Collect event-day figures from the same businesses | @Zaal | Ask | 2026-10-10 |
| Publish the combined lift figure - city, sponsors, newsletter | @Zaal | Outbound, gated | 2026-10-17 |

## Sources

- [FULL - transcript read verbatim] `research/events/2295-steve-peer-black-moon-logistics-aug15/transcript.md` - Zaal's stated goal, quoted above in full.
- [FULL - read on disk] doc 2310, the 17 Aug standup - Katina as the gift-card decision-maker, Black Moon as second stage, Steve as MC, the ~25-performer feeding plan.
- [FULL - measured 2026-08-23] 112 ZAOstock research directories; grep across all of them for baseline / economic impact / business lift / foot traffic returns only doc 1032's evacuation reference.
- [FULL - read on disk] doc 2325 (pitch deck v1 words), doc 2326 (sponsor tiers) - both need a value argument this measurement would supply.
