---
topic: events
type: event-runsheet-program
status: draft-for-decision
last-validated: 2026-08-22
supersedes: "428"
related-docs: "428, 1032, 2295, 2310"
original-query: "we have to make our run of show asap before Mondays meeting"
tier: STANDARD
---

# 2391 - ZAOstock Run of Show v2 (Oct 3, 2026) - two stages, 45-minute cadence

> **Goal:** The timed grid for 3 October, rebuilt on the decisions made at the
> 15 Aug Steve Peer call (doc 2295) and the 17 Aug standup (doc 2310). It replaces
> doc 428, which was written in April against a ONE-stage design and is still the
> schedule the public `zaostock.com/program` page renders today.
>
> **This is a decision document, not a locked schedule.** Six decisions below need
> the Monday 24 Aug 11:30 EDT standup. Everything else is derived from what is
> already on the record.

**No artist is named anywhere in this document.** The roster lives in the ZAOstock
Supabase `artists` table, which this machine holds no key for. Two acts are named
in any local source - Werb and Lyons Den - and both are recorded as *talked to
about performing*, not confirmed. Slots are therefore numbered, with the stage,
the window and the person who fills them stated. Filling a slot with a plausible
name would make this document worse than empty.

---

## The city is in the room on Monday, which changes what this has to answer

Roddy (City of Ellsworth) has accepted the standup invite. That makes Monday the
cheapest chance we will get to close the permit chain, and it moves two items from
"prudent" to "conditional".

**The 45-day notice window has already passed.** Doc 1032's Finding 7 quotes
Ellsworth Ordinance Chapter 14 directly: 45 days' minimum notice to the Police
Chief, a corporate surety bond from a Maine-authorized bonding company, and the
Police or Fire Department may require paid personnel on site at our expense.
Forty-five days before 3 October is **19 August**. That was three days ago.

This is **not** a claim that we have missed the permit. Doc 1032 flagged an open
question that was never closed: whether ZAOstock qualifies for the city-sponsored
exemption via the Art of Ellsworth umbrella, in which case the standalone-applicant
deadline never applied to us. Nobody has answered it, and the person who can will
be on the call. It is a two-minute question that has been open since July.

**The insurance certificate is a permit condition, not diligence.** The fire
performance and the vendor set both sit behind it (doc 1045), and Roddy's legal
team is separately drafting the city liability release. The broker research is done
and ranked already - Brown Holmes & Milliken in Ellsworth first, as a warm contact
- so what is missing is a phone call, not a decision.

None of this is run-of-show material and it is deliberately not in the grid. It is
here because a document that goes in front of the city on Monday should not leave
its own permit chain unstated.

---

## What changed since doc 428

| | Doc 428 (Apr 2026, live on the site) | This doc (Aug 2026 decisions) |
|---|---|---|
| Stages | One | **Two, alternating** (2295 decision 1, 2310 decision 4) |
| Block length | 15-30 min, fluid | **45-minute cadence** (2310 decision 4) |
| Structure | 5 music sets + 3 WaveWarZ rounds + 5 talks | Continuous music, no gap (Steve's explicit ask) |
| After-party | "call to Black Moon" at 17:55 | **18:00-20:00, programmed, indoors** (2310 decision 6) |
| Soundchecks | not addressed | **None day-of. Friday is mandatory and contractual** (2310 decision 5) |

**Action this implies - now in flight.** `src/app/program/page.tsx` was still
serving the doc-428 schedule publicly. It is rebuilt from this document in
`ZAODEVZ/ZAOstock` PR #40, awaiting review.

One correction to this doc's first draft, from re-measuring rather than assuming:
the page did **not** still say "Lineup announces August 2026". That string was
already fixed on `main` and in production, which reads "Lineup announced once every
set is locked" - verified by fetching the live page directly. The stale reading
came from a second clone (`~/Documents/ZAOstock-canonical`) sitting on an old
branch. Both clones point at the same repo; only one was current. What was
genuinely stale, and is what PR #40 fixes, is the single-track structure and the
15-30 minute set lengths.

---

## The arithmetic, first, because it decides everything else

Two alternating stages means one act at a time - that is the whole point of
alternating, and it is why there is no gap in the music. So the day has ONE
timeline, not two parallel ones.

```
12:00 -> 18:00   =  360 minutes
360 / 45         =  8 acts.  Exactly 8, with zero slack.
```

Against an artist target of "somewhere between 15" (Steve, 2310).

**These reconcile, and the reconciliation is the useful part.** ~15 is a count of
PERFORMERS, not of ACTS. Doc 2295 records the ceiling as "under 20-25 performers
total". The after-party alone absorbs 8-11 of them: Steve's hip-hop crew is 4-5
rappers plus a DJ as a single anchor block, plus one of Steve's own bands.

| Segment | Blocks | Performers |
|---|---|---|
| Main show 12:00-18:00 | 8 | 8 acts, size unknown |
| After-party 18:00-20:00 | 3 | crew (5-6) + band (3-5) |
| **Total** | **11 blocks** | **~16-19 performers** |

That lands inside both "somewhere between 15" and "under 20-25".

**And the confirmed roster already fills the daytime grid.** Doc 2295 records 6
out-of-state artists confirmed flying out plus 2 local Maine acts. Eight. The grid
needs eight. Whether those six travellers are six distinct ACTS or fewer larger
ones is the single fact that decides whether booking is finished or short - it is
not recorded anywhere and it is decision 2 below.

---

## Decision 1 - 45-minute SET, or 45-minute SLOT?

The two sources disagree, and the disagreement is load-bearing rather than
cosmetic.

- Doc 2295, 15 Aug, **Zaal**: *"we are doing like 20 and 40 minutes sets"* - the
  doc records it as "Sets are 20 or 40 minutes."
- Doc 2310, 17 Aug, **Steve**: *"everybody's got a 45-minute set. You know, we have
  it laid out like clockwork."* Recorded as decision 4.

The 17th is later and is the recorded decision, so 45 wins on precedence. But a
45-minute set on a 45-minute cadence leaves the day with zero slack, and Steve
himself names the problem in the same breath: *"of course, we know it's not going
to run like clockwork."*

| | Sets | Slots 12:00-18:00 | Slack |
|---|---|---|---|
| A - 45-min set, 45-min cadence | 45 | 8 | **none** |
| **B - 40-min set inside a 45-min slot (recommended)** | **40** | **8** | **5 min per slot, 40 min across the day** |
| C - 30-min sets | 30 | 12 | absorbs more acts, contradicts decision 4 |

**Recommend B.** It keeps Steve's 45-minute clockwork cadence exactly as decided,
keeps the eight-slot grid, and it is simultaneously Zaal's own 40-minute number
from two days earlier - the two sources stop disagreeing. The 5 minutes is the
MC's: Steve talking over a resetting stage is not a gap in the music, it is the
handoff.

---

## Decision 2 - are the 6 travelling artists 6 acts, or fewer?

If six acts, plus two local, the eight daytime slots are full and booking is
closed. If those six are members of, say, four acts, the day is two acts short
and that is a booking emergency at 42 days out, not a Monday agenda item.

Nobody has written this down. It is one question to whoever holds the roster.

---

## Decision 3 - the grid, and which stage closes

Recommended grid. OUT = outdoor Franklin St Parklet. IN = indoor Black Moon.

| # | Window | Stage | Dark stage is doing |
|---|---|---|---|
| 1 | 12:00 - 12:45 | **OUT** | IN resets act 2 |
| 2 | 12:45 - 13:30 | **IN** | OUT resets act 3 |
| 3 | 13:30 - 14:15 | **OUT** | IN resets act 4 |
| 4 | 14:15 - 15:00 | **IN** | OUT resets act 5 |
| 5 | 15:00 - 15:45 | **OUT** | IN resets act 6 |
| 6 | 15:45 - 16:30 | **IN** | OUT resets act 7 |
| 7 | 16:30 - 17:15 | **OUT** | IN resets act 8 |
| 8 | 17:15 - 18:00 | **IN** | OUT begins strike early |

Four outside, four inside - exactly Steve's *"if you have 10 acts it'll be five
outside five inside."* Steve's own guidance (doc 2295 re-verify) is to **assign**
performers to stages rather than poll preferences, "to save a lot of bullshit."

**Why it closes indoors.** The after-party is in that same room at 18:00. Closing
inside means the crowd migration happens at 17:15, led by the MC, under music -
and at 18:00 nobody has to move at all. It also frees the outdoor crew to start
strike at 17:15 instead of 18:00, which pulls 45 minutes out of the load-out that
doc 1032 runs to 22:30.

**The alternative, if the headline must play outdoors** to the larger crowd: swap
7 and 8. The cost is a full-crowd migration at 18:00 and no early strike.

---

## Decision 4 - the Friday soundcheck has nowhere to happen

The mandatory Friday soundcheck (2310 decision 5) is contractual and doubles as
content capture. But two decided facts collide:

- Doc 1032's load-in timeline puts **outdoor stage assembly at 07:00-08:00 on
  Oct 3**, with sound and lighting install 08:00-09:30.
- So **on Friday 2 October, the outdoor stage does not exist yet.**

The four outdoor acts cannot line-check on the outdoor PA on Friday. Three ways
out:

1. **Move the outdoor build to Friday.** Cleanest for sound, most expensive - it
   is a Wallace Events question about tent/stage delivery day, plus an overnight
   security question for gear left on a public parklet.
2. **All Friday checks happen on the Black Moon indoor stage (recommended).**
   Friday then checks the *artist* - their inputs, their backline, their tracks,
   their gear working at all, and the engineer meeting them - which is 90% of what
   day-of soundchecks buy. It does not check the outdoor PA, which is covered
   separately by doc 1032's existing **09:00-10:30 system check** on Oct 3. That
   is a system check, not an artist soundcheck, so it does not violate decision 4.
3. **Accept a pre-doors outdoor line-check window 10:30-11:30 on Oct 3.** This is
   a day-of soundcheck under another name and contradicts a decision made two days
   ago. Named only so the meeting can reject it explicitly.

**Proposed Friday block, contingent on option 2 - PROPOSED, not decided:**

| Friday 2 Oct | What |
|---|---|
| 16:00 - 17:00 | Four outdoor acts, 15 min each, indoor stage, inputs + backline logged |
| 17:00 - 18:00 | Four indoor acts, 15 min each, on the stage they actually play |
| 18:00 - 20:00 | Content capture night - the reason this is in the contract |

Fifteen minutes per act is a line check, not a rehearsal. The deliverable is a
written input list per act, which is what makes a day-of changeover possible in a
45-minute dark window.

**This grid depends entirely on Friday happening.** With no Friday and no day-of
soundcheck, an act's first sound is in front of an audience. Doc 2310's decision 4
and decision 5 are one decision, not two - if Friday slips, the schedule needs
day-of checks back and the eight-slot grid does not survive.

---

## Decision 5 - who owns each slot

Three jobs run every slot: **cue** (get the act on, on time), **MC** (talk to the
room), **stream** (it goes out). Sourced names only.

| Job | Who | Source | Status |
|---|---|---|---|
| MC, part of the event | **Steve Peer** | 2295, verbatim: *"I'd be glad to... do whatever copy you come up with and improv"* | CONFIRMED |
| MC, the rest | **UNNAMED** | Steve's yes covers "part of it" only | **DECIDE MONDAY** |
| Music + AV lead | **Dcoop** | 2310 team structure | CONFIRMED |
| PA on both stages | **Steve Peer** | 2310, verbatim: *"I'll make sure that sound and PA are provided on each stage"* | **SCOPE UNKNOWN** - see below |
| Sound setup | **Stilo World + 1 helper** | 2310: *"all we need is really one other person to kind of help with setting up"* | CONFIRMED, helper unnamed |
| Venue / logistics | **Steve Peer + Katina** | 2310 team structure | CONFIRMED |
| Design | **Paper + Candy** | 2310 team structure | CONFIRMED |
| Stage Manager, OUT | **UNNAMED** | doc 1032 defines the role, never names it | **DECIDE MONDAY** |
| Stage Manager, IN | **UNNAMED** | same | **DECIDE MONDAY** |
| Stream operator | **UNRESOLVED** | Baraza OBS-to-RTMP test with Aziz, card 654b9aba, was due 2026-08-22 | **DECIDE MONDAY** |
| Site Lead / weather call | **Zaal** | doc 1032, answered 2026-07-12 | CONFIRMED, but see below |
| First Aid Lead | **Zaal** | doc 1032, same answer | **UNRESOLVED** - one person cannot hold both through a 6-hour show, flagged in 1032 since July |

**Recommended MC split, for Monday:** Steve MCs the four indoor slots - his room,
his crowd, and it is his after-party to hand into. Zaal MCs the four outdoor
slots. Neither has to be anywhere they are not already standing.

**On the PA.** The offer is real and verbatim. What it covers is not known - doc
2310 records Zaal and Dcoop both saying so on the call: *"this is the first time
we're talking about it... good to have our backups."* Four fallbacks exist
(college AV cold-DM push, Katina's Nextdoor route, Dcoop's monitors, Dcoop buying
reusable gear self-funded). The gap is a scope list - gear, capacity, setup and
strike, operator, power, date and time, price, cancellation - and it is a
conversation, not a document.

---

## Decision 6 - is WaveWarZ in the day, and where?

Doc 428 built the whole afternoon around a 4-artist, 3-round WaveWarZ bracket. The
17 Aug standup does not mention WaveWarZ at all. But doc 2295 records Zaal calling
it *"our big showcase"* and describing exactly the physical form: *"we have an
emcee and two artists doing a little battle of music between each other with people
online, visually watching and participating in being a part of the voting."*

So it is intended, and it is unscheduled. Three shapes:

1. **Drop it from Oct 3.** The grid is already full at eight slots.
2. **One battle occupies one of the eight slots** (recommended if it is in). Two
   artists, one emcee, one 40-minute block, online voting. It costs one act slot,
   which decision 2 may not have to spare.
3. **Put it in the after-party**, where Steve's crew is already set up for people
   to *"chime in"* and *"riff along"* - the format is closer to a cypher than a
   set, and the room is smaller and louder.

Not decided here. Naming rounds, artists or a bracket would be inventing.

---

## The full day, assembled

| Time | Where | What | Owner |
|---|---|---|---|
| 05:30 | site | Site Lead arrives, weather check, walk grounds | Zaal (doc 1032) |
| 06:00 - 11:30 | site | Load-in per doc 1032 - unchanged by this doc | load-in crew |
| 09:00 - 10:30 | OUT | **PA system check** - system, not artists. Does not violate the no-soundcheck rule | Stilo World + helper |
| 10:30 | site | Volunteer check-in opens | volunteer coord |
| 11:30 | both | All crews in position, radio check, go/no-go | Zaal |
| **12:00 - 12:45** | **OUT** | **Slot 1** | MC Zaal |
| 12:45 - 13:30 | IN | Slot 2 | MC Steve |
| 13:30 - 14:15 | OUT | Slot 3 | MC Zaal |
| 14:15 - 15:00 | IN | Slot 4 | MC Steve |
| 15:00 - 15:45 | OUT | Slot 5 | MC Zaal |
| 15:45 - 16:30 | IN | Slot 6 | MC Steve |
| 16:30 - 17:15 | OUT | Slot 7 | MC Zaal |
| 17:15 - 18:00 | IN | Slot 8 - closes inside, crowd is already where the after-party is | MC Steve |
| 17:15 - 18:00 | OUT | Outdoor strike begins early | load-out crew |
| **18:00 - 18:40** | **IN** | **After-party block 1** - Steve's hip-hop crew, 4-5 rappers + DJ, open to riff along | MC Steve |
| 18:40 - 19:20 | IN | After-party block 2 - one of Steve's own bands | MC Steve |
| 19:20 - 20:00 | IN | After-party block 3 - DJ close | MC Steve |
| 18:00 - 22:30 | OUT | Load-out per doc 1032 | load-out crew |

Steve also floated an **afternoon teaser gig** for the hip-hop crew - *"ideal for
a little spot in the afternoon, like a little teaser gig, which is not that
important at the moment."* Deliberately not placed: it would consume one of the
eight slots, which decision 2 may not allow, and Steve himself deprioritised it.

Contingency inherits from doc 428 unchanged and still holds: protect music, cut
talk; a cancelled act becomes an extended DJ block; weather moves under the
Wallace Events tent with no schedule change; the Site Lead owns the pause call.
The two-stage design adds one contingency of its own - **if either stage fails
entirely, the other absorbs the whole day at 45-minute cadence with 8 acts back to
back and changeovers becoming visible gaps.** That is the degraded mode, and it is
survivable, which the one-stage design was not.

---

## Follow-through - who owes what, to whom, by when

| Owed | By | To | When |
|---|---|---|---|
| Decision 1: 45-min set vs 40-min set in a 45-min slot | Zaal + Steve | the grid | Mon 24 Aug standup |
| Decision 2: are the 6 travelling artists 6 acts? | whoever holds the roster | Zaal | Mon 24 Aug standup |
| Decision 3: closes indoors, or swap 7 and 8 | Zaal + Steve | the grid | Mon 24 Aug standup |
| Decision 4: Friday soundcheck venue - indoor-only, or move the outdoor build | Zaal + Dcoop + Steve | artist contracts | Mon 24 Aug standup |
| Decision 5: name both Stage Managers; split First Aid off Zaal | Zaal | doc 1032's open item since July | Mon 24 Aug standup |
| Decision 6: WaveWarZ in the day, in the after-party, or out | Zaal | the grid | Mon 24 Aug standup |
| PA scope list - gear, capacity, setup/strike, operator, power, time, price, cancellation | Zaal | Steve, in person | before Fri 29 Aug |
| Equipment spec (was due Fri 21 Aug, arrival unconfirmed) | Fellenz + Dcoop | Zaal | overdue, confirm either way |
| Stream operator resolved (Baraza OBS-to-RTMP, card 654b9aba, due 22 Aug) | Zaal + Aziz | the grid | overdue |
| Confirm the Art of Ellsworth permit-exemption question - the 45-day standalone window closed 19 Aug | Zaal | Roddy, in the room | Mon 24 Aug standup |
| Insurance certificate - it is a permit condition, brokers already ranked (BHM Ellsworth first) | Zaal | the city + the fire performance | before the permit closes |
| Replace or unpublish `zaostock.com/program` - it serves the April one-stage schedule and says "lineup announces August 2026" | Zaal + Paper | the public | before the lineup reveal |
| Artist contracts carrying the Friday soundcheck clause | Zaal | the 8 acts | Mon 24 Aug (doc 2310) - the same day as the standup |

---

## Also See

- [Doc 428 - Run-of-Show Program](../428-zaostock-run-of-show-program/) - **superseded by this doc**; still what the public `/program` page renders
- [Doc 1032 - Day-of Operations Plan](../1032-zaostock-day-of-operations-plan/) - load-in, load-out, safety, signage. Unchanged by this doc and still the operational spine around it
- [Doc 2295 - Steve Peer x Zaal, Black Moon becomes the second stage](../2295-steve-peer-black-moon-logistics-aug15/)
- [Doc 2310 - ZAOstock standup, 17 Aug](../2310-zaostock-standup-aug17/)

## Sources

- Doc 2310 README + `transcript.md` (682 lines), read in full for the two-stage and
  45-minute passages - lines 456-530 quoted directly - [FULL, local]
- Doc 2295 README + `transcript.md`, lines 18-24 for the MC commitment, the
  20/40-minute set length and the no-gap framing - [FULL, local]
- Doc 1032 Findings 1 and 6 for the load-in/load-out timeline that constrains the
  Friday soundcheck - [FULL, local]
- Doc 428 in full, as the superseded design - [FULL, local]
- `ZAOstock-canonical/src/app/program/page.tsx` and `src/lib/artists.ts`, read
  directly for what the public page currently serves and where the roster lives -
  [FULL, local]
- Artist roster: **NOT FETCHED.** It is in the ZAOstock Supabase `artists` table
  and this machine holds no ZAOstock key. Werb and Lyons Den are named in doc 2298
  and `zao-vault/onenote/todo/zaal-todos.md`, both as "talked to about performing"
  - [PARTIAL, and deliberately not extrapolated into slots]
