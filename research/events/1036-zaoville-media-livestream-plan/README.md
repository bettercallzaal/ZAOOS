---
topic: events
type: guide
status: research-complete
last-validated: 2026-07-11
superseded-by:
related-docs: "1030, 1013, 1035"
original-query: "we are focused on media and livestreaming for that [ZAOville] - zaoville is at dcoop's house, no permitting problem"
tier: DISPATCH
---

# 1036 — ZAOville Media & Livestream Plan: Adapting Doc 1030 for DCoop's House

> **Goal:** Zaal confirmed the team's current active focus is media/livestreaming for ZAOville (DMV, Jul 2026, DCoop's house) - using it as the live dry run for the same owned-gear stack (Meta glasses, cameras, extra phones) doc 1030 built for ZAOstock's Oct 3 outdoor Franklin Street Parklet venue. This doc identifies exactly what carries over unchanged, what gets easier, and what's a genuinely new problem at this different venue.

## Key Decisions

| Recommendation | Why |
|---|---|
| **Reuse doc 1030's gear stack and roles wholesale - ATEM Mini Pro, DI/interface audio bundle, Meta glasses for POV only, phones as backup connectivity** | Nothing about the venue change invalidates the underlying technical plan. ZAOville is the cheapest possible place to test this exact stack before Oct 3 - lower stakes, smaller crowd, one evening, at a venue the crew has more informal access to for setup/teardown |
| **Treat ZAOville as the dry run doc 1030's Next Actions already called for, not a separate purchase decision** | Doc 1030 already lists "run a full end-to-end test stream at least 2 weeks before Oct 3" as a Tier action. ZAOville lands in July - well ahead of that Sep 19 deadline - making it a better, earlier dry run than what 1030 originally planned for |
| **Confirm 3 venue-specific unknowns before ZAOville, not day-of**: house WiFi speed/reliability, whether The VEC's DJ booth has a mixer aux-send (not just powered monitors), and how close the stage/DJ setup sits to the pool for the Night Swim finale | These are the ZAOville-equivalent of doc 1030's "confirm the owned cameras have clean HDMI out" - each is a single fact that changes the whole plan, and each is answerable in one visit to the house before the event, not guessed at |
| **Plan for a lighting transition mid-event, which ZAOstock's plan never had to solve** | The lineup (`/zaoville` page) runs 3:00 PM open mic through a 8:40 PM finale into a Night Swim DJ set to 10:00 PM - daylight into full dark, across roughly 7 hours. ZAOstock's Oct 3 slot (noon-6 PM) stays in daylight the whole time. Camera exposure settings and any lighting gear are a new problem ZAOville surfaces first |
| **Do NOT treat "private venue, no permit" as "no prep needed"** | The confirmed private-property status (doc 1013) removes the permit/insurance cost question, but says nothing about whether the house has adequate power circuits, WiFi bandwidth, or a real mixer - those are separate, still-open technical questions this doc raises |

## Findings

### 1. What carries over unchanged from doc 1030's owned-gear plan

Doc 1030 already did the hard research on this exact gear stack. None of it is venue-specific:

- **Meta Ray-Ban glasses**: same 5-minute clip cap, same 30-60 minute battery-swap cadence, same conclusion - good for POV/backstage/artist-eye-view b-roll and socials, not for continuous switched coverage. ZAOville's DJ-to-live-set-to-DJ format (see lineup below) is actually a good format to test this on: POV during a DJ transition or backstage before Ashley/Lyons Den/DCoop/PROF!T/John Clark/ELYVN sets.
- **ATEM Mini Pro as the switcher**: same $325 unit, same role - cut between camera angles, encode, push live. If it's bought for Oct 3 anyway, testing it at ZAOville first is free additional value from the same purchase.
- **Phones as connectivity backbone**: the dual-phone-bonded-hotspot approach (Moblin/Larix, one phone per carrier) doc 1030 recommended for outdoor Ellsworth is a reasonable fallback here too, but see Finding 2 - a private house is the one case where the answer might just be "plug into the router," which ZAOstock's outdoor venue never had the option to do. [FULL - directly reused from doc 1030, no new research needed]

### 2. What gets easier at a private house vs. an outdoor public parklet

Every hard problem in doc 1030 that came from ZAOstock's venue being outdoor and public disappears or shrinks at DCoop's house:

- **Power**: doc 1030 budgeted $150-300 for dummy-battery AC adapters and a UPS backup because outdoor gear has no wall power. A house has real outlets. This budget line likely drops to near $0, pending confirming there are enough circuits near the setup point to avoid tripping a breaker with switcher + cameras + DJ gear all running.
- **Weatherproofing**: doc 1030 budgeted $150-300 for a canopy/EZ-Up and rain covers because rain kills unprotected gear outdoors within 30-60 minutes. Indoors, for the 3:00-8:40 PM portion of the lineup, this is a non-issue. It becomes a real question again only for the Night Swim DJ finale if any gear is near the pool deck (Finding 3).
- **Connectivity**: doc 1030's whole Finding 2 was built around Ellsworth's outdoor cellular coverage numbers because there's no house WiFi to fall back on at a public parklet. DCoop's house almost certainly has home internet - if the upload speed is enough (needs an actual speed test, not an assumption), a wired or WiFi connection beats phone-hotspot bonding on both reliability and cost. This is the single biggest potential simplification ZAOville offers over the Oct 3 plan. [PARTIAL - reasoned from the venue-type change confirmed in doc 1013; the actual WiFi upload speed at the house has not been tested]

### 3. What's a genuinely new problem doc 1030 never had to solve

- **The Night Swim DJ finale runs the DJ booth near a pool** (per the `/zaoville` page lineup: "Finale - 10:00, Night Swim DJ Set, DJ"). Doc 1030's entire equipment list - ATEM switcher, cameras, audio interface - is electronics that should not be within splash range of a pool. This needs a real answer: either the DJ/stream setup stays a safe distance from the pool deck for that segment, or the stream deliberately stops covering the Night Swim portion and picks back up for socials/POV content only (Meta glasses, which are more water-tolerant and lower-consequence if they get wet, are the better tool for that specific segment regardless).
- **7-hour span crossing daylight into full dark** is a real production variable ZAOstock's daytime-only slot doesn't have. A fixed camera exposure setting that looks right at 3 PM will be badly under- or over-exposed by 8 PM. This needs either manual exposure adjustments partway through (someone's job, not automatic) or cameras left on auto-exposure with the tradeoff of some visible brightness hunting during transitions. Doc 1030 never had to make this call.
- **The VEC's provided equipment is confirmed as DJ sound management + Sennheiser wireless mics + 2 JBL monitors** - this is a DJ/PA rig, not confirmed to include a mixer with a dedicated aux-send output. Doc 1030's audio plan (Finding 4) depends on tapping a FOH aux send into a DI box - if The VEC's setup doesn't have that, the audio-into-stream signal chain needs a different starting point (e.g., a mic split or a direct feed from whatever the DJ controller outputs), which is a different, not-yet-researched problem. [FULL - directly read from the live `/zaoville` page; the mixer/aux-out question is an open gap, not researched]

## Also See

- [Doc 1030 — ZAOstock Live Media Production: Field Broadcast Plan](../1030-zaostock-livestream-media-production/) — the source plan this doc adapts; all gear-stack and role research lives there, not duplicated here
- [Doc 1013 — ZAO Festivals Budgets](../../business/1013-zaofestivals-budgets-zaostock-zaoville/) — source of the confirmed private-venue/no-permit status this doc builds on
- [Doc 1035 — ZAOstock Master Punch List](../1035-zaostock-master-punch-list/) — doc 1030's livestream-lead-unowned item and gear-purchase item live in that consolidated list; this doc's new venue-specific actions below should be added there next time it's reviewed
- `zaostock/src/app/zaoville/page.tsx` — source of the confirmed lineup, timing, and VEC-provided-equipment list used throughout this doc

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Test the house WiFi upload speed at DCoop's house before the event - if it's reliable, use it instead of phone-hotspot bonding for ZAOville (simpler and cheaper than the Oct 3 outdoor plan) | Zaal | Todo | 2026-07-18 |
| Confirm whether The VEC's DJ setup includes a mixer with an aux-send, or whether the stream audio needs a different tap point than doc 1030's DI-box plan assumes | Zaal | Todo | 2026-07-18 |
| Decide the Night Swim DJ finale's media coverage plan given pool proximity - full switched coverage from a safe distance, or POV/glasses-only for that segment | Zaal | Task | 2026-07-21 |
| If the ATEM Mini Pro and audio DI/interface bundle (doc 1030, $325 + $250-300) are bought in time, treat ZAOville as the real end-to-end dry run doc 1030 already called for - log what breaks | Zaal | Task | ZAOville event date (Jul 2026, exact day TBD) |
| Confirm ZAOville's exact date - the live `/zaoville` page states "Jul 2026" with no specific day found anywhere in the repo | Zaal | Todo | 2026-07-14 |

## Sources

- [Doc 1030 — ZAOstock Live Media Production](../1030-zaostock-livestream-media-production/) — [FULL, internal, this doc's entire gear/role foundation]
- [Doc 1013 — ZAO Festivals Budgets](../../business/1013-zaofestivals-budgets-zaostock-zaoville/) — [FULL, internal, source of confirmed private-venue status]
- `zaostock/src/app/zaoville/page.tsx` — [FULL, read directly this session, source of the lineup, timing, and VEC-equipment list]
