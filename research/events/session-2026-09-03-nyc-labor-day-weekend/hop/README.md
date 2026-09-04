# Hop — NYC night router

Published artifact: `https://claude.ai/code/artifact/674f391f-9892-4521-a9f6-69a3b1028c3c`
Source of record: `hop.html` in this directory. The artifact is a view; this file is
the copy (`documentation-in-repo.md`).

Built 2026-09-04, mid-trip, from the one insight this session actually produced:

> **An event's cost is not its distance. It is how long it takes to get home from
> it, given where you are sleeping THAT night.**

The same party in Williamsburg is nearly free on Thursday (base: Williamsburg) and
costs 75-90 minutes on Friday (base: Jersey City). No public event tool models
this, because no public event tool knows where you sleep.

## What it does

- **Per-day base.** Thu Williamsburg, Fri/Sat Jersey City, seeded from the real trip.
- **Costs every stop by travel time HOME**, not travel time there, and bands it
  cheap / ok / expensive.
- **Renders the day as a subway line** - stops on a line, hop times between them.
- **Anchors vs floaters.** Anchors are gold and immovable; floaters are droppable.
- **Auto drop list**, floaters sorted by most-expensive-to-get-home-from first,
  so the cut is decided in advance rather than on a platform at 1am.
- Persists to `localStorage`, and to the `db` capability when the viewer has it,
  so the itinerary survives a closed tab and follows across devices.

## The travel model, stated honestly

Estimates, not live transit data:

```
t = 8 min (door + platform + wait)
  + haversine_km / 18 km/h        (effective in-city transit speed)
  + 8 min   crossing the East River (Manhattan <-> Brooklyn/Queens)
  + 15 min  crossing the Hudson (PATH, anything <-> NJ)
  + 22 min  additional for Brooklyn/Queens <-> NJ (two crossings)
  + 7 min   after 23:00, 12 min after midnight (headways stretch)
```

Every number above is a judgement call, and the page says so in its own footer.
The model is deliberately explainable rather than fake-precise - a wrong number a
reader can see and correct beats a confident one from an opaque source
(`state-claims.md`).

## What it deliberately does NOT do

**No event discovery.** That was the lesson of 2026-09-04: this container cannot
load any event platform, and searching cannot substitute (see the retraction in
`EVENT-DISCOVERY-METHOD.md`). Discovery is the human's, with the Luma map open.
Hop is the triage half - and triage was always the harder and more valuable half.

## If this becomes the real product

The Luma JSON API takes **coordinates** in `search_events`. That is the missing
input: pull events near a base, run them through this cost model, and the manual
paste step disappears. That is the whole tool, and it is small.

Check `eventmates.app` and the five Apify Luma actors before building the
discovery half - see `EVENT-DISCOVERY-METHOD.md`.
